import {
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Inject,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntil, tap } from 'rxjs/operators';
import { NgSelectConfig } from './config.service';
import { ConsoleService } from './console.service';
import { NgDropdownPanelService } from './ng-dropdown-panel.service';
import { DefaultSelectionModelExtFactory, ItemsListExt } from './ng-select-ext-model';
import { NgSelectComponent, SELECTION_MODEL_FACTORY } from './ng-select.component';
import { NgOption } from './ng-select.types';
import { SelectionModelFactory } from './selection-model';

import { isDefined, isObject } from './value-utils';

@Component({
  selector: 'ng-select-ext',
  templateUrl: './ng-select-ext.component.html',
  styleUrls: ['./ng-select-ext.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgSelectExtComponent),
      multi: true,
    },
    {
      provide: SELECTION_MODEL_FACTORY,
      useValue: DefaultSelectionModelExtFactory,
    },
    NgDropdownPanelService,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class NgSelectExtComponent extends NgSelectComponent {
  // integrated select all header. Will be replaced if header template is used. Only available if fastSelection is enabled
  @Input() displaySelectAll = true;
  // number of selections allowed, otherwise show  n / Total
  @Input() displayLimit = 3;
  // allow excluded items as value model if total unselected is lower than selected
  @Input() isExclusive = true;
  // ignore isExclusive and will use selected as value model
  @Input() exclusionTreshold = 100;
  // directly manipulate selected property of item items and set selection based on selected items. It will ignore
  @Input() fastSelection = true;
  // integrated cancel/ok buttons as footer. Only trigger model update if 'OK' is clicked or clicked outside
  @Input() displayActionButtons = true;
  // change layout to mobile
  @Input() isMobile = false;
  // data change event will only emit if selection changed.
  @Input() emitDataChange = true;
  @Input() hideDisabled = true;
  @Input() bindLabel = 'name';
  @Input() bindValue = 'id';

  @Output('dataChange') dataChangeEvent = new EventEmitter();

  selected_all = false;
  commit_changes = true;
  initial_state: any;


  itemsList: ItemsListExt;
  __console: ConsoleService;


  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.isOpen) {
      this.dropdownPanel.adjustPosition();
      this.dropdownPanel._updateXPosition();
    }
  }
  constructor(
    @Attribute('class') classes: string,
    config: NgSelectConfig,
    @Attribute('autofocus') autoFocus: any,
    @Inject(SELECTION_MODEL_FACTORY)
    newSelectionModel: SelectionModelFactory,
    _elementRef: ElementRef<HTMLElement>,
    _cd: ChangeDetectorRef,
    _console: ConsoleService
  ) {
    super(classes, autoFocus, config, newSelectionModel, _elementRef, _cd, _console);
    this.__console = _console;
    this.itemsList = new ItemsListExt(this, newSelectionModel());
    this.searchable = false;
    this.clearOnBackspace = false;
    this.virtualScroll = true;
    this.appendTo = 'body';
    this.hideDisabled = true;
    this.disableSort = false;
  }

  ngOnInit() {
    super.ngOnInit();
    if (!this.multiple) {
      this.displaySelectAll = false;
      this.displayActionButtons = false;
    } else {
      this.closeOnSelect = false;
    }
    if (!this.fastSelection) {
      this.displaySelectAll = false;
    }

    this._keyPress$.pipe(takeUntil(this._destroy$)).subscribe((term) => {
      if (!this.isOpen) {
        this.open();
      }
    });
  }

  selectAll($event) {
    const selected = $event.target.checked;
    this.itemsList.filteredItems.forEach((item) => {
      item.selected = selected;
    });
    this.itemsList.selectedItems = this.itemsList.items.filter(({ selected }) => selected);
  }

  open() {
    super.open();

    if (this.disabled) {
      return;
    }


    if (this.displayActionButtons) {
      this.commit_changes = false;
    }
  }

  close() {
    super.close();
  
    if (this.displayActionButtons) {
      if (!this.commit_changes) {
        this._handleWriteValue(this.initial_state);
      } else {
        this._updateNgModel();
      }
    }
  }

  toggleItem(item: NgOption) {
    super.toggleItem(item);
    this.selected_all = this.itemsList.filteredItems.length === this.itemsList.filteredItems.filter(({ selected }) => selected).length;
  }

  _updateNgModel() {
    if (!this.commit_changes && this.displayActionButtons && this.isOpen) {
      return;
    }

    let model: any = [];
    if (this.fastSelection) {
      if (this.bindValue) {
        model = this.selectedItems.map(({ value }) => value[this.bindValue]);
      } else {
        model = this.selectedItems.map(({ value }) => value);
      }
    } else {
      for (const item of this.selectedItems) {
        if (this.bindValue) {
          let value = null;
          if (item.children) {
            const groupKey = this.groupValue ? this.bindValue : <string>this.groupBy;
            value = item.value[groupKey || <string>this.groupBy];
          } else {
            value = this.itemsList.resolveNested(item.value, this.bindValue);
          }
          model.push(value);
        } else {
          model.push(item.value);
        }
      }
    }
    model = model.sort();
    const selected = this.selectedItems.map((x) => x.value);

    if (this.isExclusive) {
      if (
        this.selectedItems.length > this.exclusionTreshold &&
        this.itemsList.items.length - this.selectedItems.length < this.selectedItems.length
      ) {
        let unselected_items = [];
        if (this.bindValue) {
          unselected_items = this.itemsList.items.filter(({ selected }) => !selected).map(({ value }) => value[this.bindValue]);
        } else {
          unselected_items = this.itemsList.items.filter(({ selected }) => !selected).map(({ value }) => value);
        }

        model = {
          exclude: 1,
          items: unselected_items.sort(),
        };
      }
    }

    if (this.multiple) {
      this._onChange(model);
      this.changeEvent.emit(selected);
    } else {
      this._onChange(isDefined(model[0]) ? model[0] : null);
      this.changeEvent.emit(selected[0]);
    }
    if (this.emitDataChange) {
      const current_selection_str = JSON.stringify(model);
      const initial_selection_str = JSON.stringify(this.initial_state);
      if (current_selection_str !== initial_selection_str) {
        this.dataChangeEvent.emit(selected);
      }
    }

    this.initial_state = model;
    this._cd.markForCheck();
  }
  protected _isValidWriteValueExt(value: any): boolean {
    if (this.multiple) {
      if (!Array.isArray(value) && value.items.length) {
        return this._isValidWriteValue(value.items);
      }
      if (!Array.isArray(value) && value.items.length === 0) {
        return true;
      }
    }
    return this._isValidWriteValue(value);
  }

  writeValue(value: any | any[]): void {
    this.itemsList.clearSelected();
    this._handleWriteValue(value);
    this.initial_state = value;
    this._cd.markForCheck();
  }

  protected _handleWriteValue(ngModel: any | any[]) {
    if (ngModel == undefined || !this._isValidWriteValueExt(ngModel)) {
      return;
    }

    const select = (val: any) => {
      let item = this.itemsList.findItem(val);
      if (item) {
        this.itemsList.select(item);
      } else {
        const isValObject = isObject(val);
        const isPrimitive = !isValObject && !this.bindValue;
        if (isValObject || isPrimitive) {
          this.itemsList.select(this.itemsList.mapItem(val, null));
        } else if (this.bindValue) {
          item = {
            [this.bindLabel]: null,
            [this.bindValue]: val,
          };
          this.itemsList.select(this.itemsList.mapItem(item, null));
        }
      }
    };

    if (this.fastSelection && this.multiple) {
      let exclude = 0;
      let items: any[] = ngModel;
      if (!Array.isArray(ngModel)) {
        items = ngModel.items;
        exclude = ngModel.exclude;
      }
      if (this.bindValue) {
        this.itemsList.items.forEach((item) => {
          if (exclude) {
            item.selected = !items.includes(item.value[this.bindValue]);
          } else {
            item.selected = items.includes(item.value[this.bindValue]);
          }
        });
      } else {
        this.itemsList.items.forEach((item) => {
          if (exclude) {
            item.selected = !items.includes(item.value);
          } else {
            item.selected = items.includes(item.value);
          }
        });
      }

      this.itemsList.selectedItems = this.itemsList.selectedItems = this.itemsList.items.filter(({ selected }) => selected);
    } else if (this.multiple) {
      (<any[]>ngModel).forEach((item) => select(item));
    } else {
      select(ngModel);
    }
  }
}
