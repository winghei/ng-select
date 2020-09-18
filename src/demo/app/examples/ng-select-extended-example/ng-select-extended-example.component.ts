import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { DataService, Person } from '../data.service';

@Component({
  selector: 'ng-select-extended-example',
  templateUrl: './ng-select-extended-example.component.html',
  styleUrls: ['./ng-select-extended-example.component.scss']
})
export class NgSelectExtendedExampleComponent implements OnInit {

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
