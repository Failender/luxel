import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {delay, retryWhen} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {SelectionModel} from '@angular/cdk/collections';


declare var XLSX;

@Component({
  selector: 'app-parse',
  templateUrl: './parse.component.html',
  styleUrls: ['./parse.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParseComponent implements OnInit {


  public selection: SelectionModel<Event>;
  public displayedColumns = ['select', 'start', 'end', 'name'];
  public events: Event[];
  public existingEvents;

  public progressBarValue = null;
  public progressBarMax = null;
  public progressBarCurrentStep;

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient) {
  }

  ngOnInit(): void {

    this.selection = new SelectionModel<any>(true, []);
  }


  public fileInputChange(event): void {

    const reader = new FileReader();
    const files = event.target.files;
    const f = files[0];
    reader.onload = e => {
      // @ts-ignore
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array', cellDates: true});
      this.prepareWorkbook(workbook);


      /* DO SOMETHING WITH workbook HERE */
    };
    reader.readAsArrayBuffer(f);
  }

  private prepareWorkbook(workbook): void {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    let i = 2;
    let currentDateValue;
    const maxFailureCount = 5;
    let failureCount = 0;
    const events: Event[] = [];
    while (true) {
      const dateCell = worksheet[`A` + i];
      const taskCell = worksheet[`E` + i];
      i++;
      const dateValue = dateCell ? dateCell.v : undefined;
      if (dateValue) {
        currentDateValue = dateValue;
      }
      const taskValue = taskCell ? taskCell.v : undefined;
      if (!taskValue || !currentDateValue) {
        failureCount++;
        if (failureCount > maxFailureCount) {
          break;
        }
        continue;
      }
      const startDate = new Date(currentDateValue);
      const endDate = new Date(currentDateValue);
      failureCount = 0;

      const dashIndex = taskValue.indexOf('-');
      const startDateString = taskValue.substring(0, dashIndex).trim();
      const endDateString = taskValue.substring(dashIndex + 1, taskValue.indexOf('(')).trim();

      const startHour = startDateString.substring(0, 2);
      const startMinute = startDateString.substring(3, 5);

      const endHour = endDateString.substring(0, 2);
      const endMinute = endDateString.substring(3, 5);

      const task = taskValue.substring(taskValue.indexOf(')') + 1).trim();

      startDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10));
      endDate.setHours(parseInt(endHour, 10), parseInt(endMinute, 10));
      if (endDate.getTime() < startDate.getTime()) {
        endDate.setDate(endDate.getDate() + 1);
      }
      startDate.setFullYear(2020);
      endDate.setFullYear(2020);


      events.push({
        endDate,
        startDate,
        name: task
      });
    }

    this.events = events;
    // this.createCalendarEvent(this.events[0]);
    if (this.events.length !== 0) {
      // We know the month now fetch all events so we can check for duplicates

      this.getExistingEvents();


    }
    this.cdr.markForCheck();
  }

  private getExistingEvents(): void {
    const startDate = new Date(this.events[0].startDate);
    startDate.setDate(1);
    const endDate = new Date(this.events[0].endDate);
    endDate.setDate(1);
    endDate.setMonth(endDate.getMonth() + 1);
    const uri = `https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&$top=9999`;

    this.http.get<any>(uri)
      .subscribe(data => {
        let events = data.value;
        events = events.filter(entry => entry.bodyPreview.indexOf('luxel') !== -1);
        this.existingEvents = events;
        this.cdr.markForCheck();
      });
  }


  private createCalendarEvent(event: Event): Observable<any> {

    const dto = {
      subject: event.name,
      body: {
        contentType: 'TEXT',
        content: 'Autogenerated luxel'
      },
      start: {
        dateTime: event.startDate.toUTCString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endDate.toUTCString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    return this.http.post<any>('https://graph.microsoft.com/v1.0/me/events', dto);
  }

  public addEvents(): void {
    const events = this.events.filter(entry => !this.doesEventExist(entry));
    this.createNextEvent(events);

  }

  public addSelectedEvents(): void {
    const events = this.selection.selected.filter(entry => !this.doesEventExist(entry));
    this.createNextEvent(events);

  }

  private doesEventExist(event): boolean {
    const existingEvent = this.existingEvents.find(entry => this.areEventsEqual(event, entry));
    if (existingEvent) {
      return true;
    }
    return false;
  }

  private areEventsEqual(event: Event, entry): boolean {
    const entryDate = new Date(entry.start.dateTime);
    entryDate.setMinutes(entryDate.getMinutes() - new Date().getTimezoneOffset());

    if (event.startDate.getTime() === entryDate.getTime() && event.name === entry.subject) {
      return true;
    }
    return false;

  }

  public deleteAllEvents(): void {
    this.deleteNextEvent(this.existingEvents);
    this.existingEvents = null;
    this.cdr.markForCheck();
  }

  private createNextEvent(events: Event[]): void {
    if (events.length === 0) {
      this.getExistingEvents();
      this.progressBarMax = null;
      this.cdr.markForCheck();
      return;
    }
    if (!this.progressBarMax) {
      this.progressBarMax = events.length;
      this.progressBarValue = 0;
      this.progressBarCurrentStep = 0;
      this.cdr.markForCheck();
    }
    const event = events.pop();


    this.createCalendarEvent(event)
      .pipe(retryWhen(errors => errors.pipe(delay(1000))))
      .subscribe((response => {
        this.progressBarCurrentStep += 1;
        this.progressBarValue = this.progressBarCurrentStep / this.progressBarMax * 100;
        this.cdr.markForCheck();

        this.createNextEvent(events);


      }));
  }

  private deleteNextEvent(events: any[]): void {
    if (events.length === 0) {
      this.existingEvents = [];
      this.cdr.markForCheck();
      this.progressBarMax = null;
      return;
    }

    if (!this.progressBarMax) {
      this.progressBarMax = events.length;
      this.progressBarValue = 0;
      this.progressBarCurrentStep = 0;
      this.cdr.markForCheck();
    }
    const event = events.pop();
    if (event.bodyPreview.indexOf('luxel') === -1) {
      console.error('skipping event ', event.bodyPreview);
      this.deleteNextEvent(events);
    }
    this.http.delete(`https://graph.microsoft.com/v1.0/me/events/${event.id}`)
      .pipe(retryWhen(errors => errors.pipe(delay(1000))))
      .subscribe((response => {
        this.progressBarCurrentStep += 1;
        this.progressBarValue = this.progressBarCurrentStep / this.progressBarMax * 100;
        this.cdr.markForCheck();
        this.deleteNextEvent(events);


      }));
  }

  public isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.events.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  public masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.events.forEach(row => this.selection.select(row));
  }


}

interface Event {
  startDate: Date;
  endDate: Date;
  name: string;
}
