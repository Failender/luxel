import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {filter, flatMap, tap} from 'rxjs/operators';

export class PagebleObservable {

  private page = new BehaviorSubject<number>(-1);
  public count;
  public loading = new BehaviorSubject(false);


  public data;

  constructor(private httpClient: HttpClient, private baseUrl: string, public pageSize = 20) {
    this.httpClient.get(baseUrl + '&top=0&$count=true')
      .subscribe(data => {
        this.count = data['@odata.count'];
        this.page.next(0);
      });

    this.data = this.page.pipe(filter(entry => entry !== -1), flatMap(data => {
        this.loading.next(true);
        return this.httpClient.get(baseUrl + `&skip=${data * 10}&$top=${this.pageSize}`);
      }),
      tap(data => this.loading.next(false)));
  }

  public setPage(page): void {
    this.page.next(page);
  }

  public next(): void {
    if (this.isNextEnabled()) {
      this.page.next(this.page.value + 1);
    }
  }

  public isNextEnabled(): boolean {
    return this.page.value < this.count / this.pageSize;
  }

  public isPreviousEnabled(): boolean {
    return this.page.value > 0;
  }

  public previous(): void {
    if (this.page.value > 0) {
      this.page.next(this.page.value - 1);
    }
  }
}
