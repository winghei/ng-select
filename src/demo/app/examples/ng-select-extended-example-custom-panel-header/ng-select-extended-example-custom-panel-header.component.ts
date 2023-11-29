import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { DataService, Person } from '../data.service';

@Component({
  selector: 'ng-select-extended-example-custom-panel-header',
  templateUrl: './ng-select-extended-example-custom-panel-header.component.html',
  styleUrls: ['./ng-select-extended-example-custom-panel-header.component.scss']
})
export class NgSelectExtendedExampleCustomPanelHeaderComponent implements OnInit {

  people: Person[] = [];
  selectedPeople:any= [];

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.people =  this.dataService.getMockItems(150000)
    this.selectedPeople = [this.people[0].id]
         
  }
  dataChange(items){
    console.log(items)
  }
}
