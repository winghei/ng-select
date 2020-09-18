import { THIS_EXPR } from "@angular/compiler/src/output/output_ast";
import { ItemsList } from "./items-list";
import { NgSelectComponent } from "./ng-select.component";
import { NgOption } from "./ng-select.types";
import { DefaultSelectionModel, SelectionModel } from "./selection-model";

export function DefaultSelectionModelExtFactory() {
  return new DefaultSelectionModelExt();
}

export class DefaultSelectionModelExt extends DefaultSelectionModel {
  constructor() {
    super();
  }

  get value() {
    return this._selected;
  }
  set value(items: NgOption[]) {
    this._selected = items;
  }
}

export class ItemsListExt extends ItemsList {
  private __selectionModel: SelectionModel;
  constructor(_ngSelect: NgSelectComponent, _selectionModel: SelectionModel) {
    super(_ngSelect, _selectionModel);
    this.__selectionModel = _selectionModel;
  }
  get selectedItems() {
    return this.__selectionModel.value;
  }
  set selectedItems(items: NgOption[]) {
    this.__selectionModel.value = items;
  }
}
