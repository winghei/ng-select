import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { DataService, Person } from '../data.service';

@Component({
  selector: 'ng-select-extended-single-select',
  templateUrl: './ng-select-extended-single-select.component.html',
  styleUrls: ['./ng-select-extended-single-select.component.scss']
})
export class NgSelectExtendedSingleSelectComponent implements OnInit {

  people: Person[] = [];
  selectedPeople;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
      this.dataService.getPeople()
          .pipe(map(x => x.filter(y => !y.disabled)))
          .subscribe((res) => {
              this.people = res;
              this.selectedPeople = this.people[0].id;
          });
  }

}
