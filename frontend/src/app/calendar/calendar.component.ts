import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MsalService} from '@azure/msal-angular';
import {MsalFetchService} from '../msal-fetch.service';
import {PagebleObservable} from '../util/pagebleObservable';
import {pluck, takeUntil} from 'rxjs/operators';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {Subject} from 'rxjs';


const CALENDAR_EVENTS = 'https://graph.microsoft.com/v1.0/me/calendar/events?$count=true';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit, OnDestroy {


  private takeUntil = new Subject();
  public startDate = new Date();
  public endDate = new Date();
  public data: PagebleObservable;

  public tableData;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public dataSource;
  public displayedColumns: string[] = ['subject'];

  constructor(private http: HttpClient, private authService: MsalService, private msalService: MsalFetchService) {

  }

  ngOnInit(): void {
    this.startDate.setFullYear(2016, 1, 1);
    this.search();
  }

  public search(): void {

    const baseUri = `https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${this.startDate.toISOString()}&endDateTime=${this.endDate.toISOString()}`;
    this.data = new PagebleObservable(this.http, baseUri);
    this.tableData = this.data.data.pipe(pluck('value'));

    this.dataSource = new MatTableDataSource();
    this.tableData.pipe(takeUntil(this.takeUntil))
      .subscribe(data => this.dataSource.data = data);

    this.data.loading.subscribe(console.debug);
  }

  ngOnDestroy(): void {
    this.takeUntil.unsubscribe();
  }

  public onPage(event): void {
    this.data.setPage(event.pageIndex);
    console.debug(event);
  }

}
