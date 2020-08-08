import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {forkJoin, Observable} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MsalFetchService {

  constructor(private http: HttpClient) {
  }


  public getAllDate(baseUri: string): Observable<any> {
    const uri = baseUri + '&$count=true';
    return this.http.get(uri).pipe(
      flatMap(data => {
        const count = data['@odata.count'];

        const observables = [];
        for (let i = 0; i < count && i < 30; i += 10) {
          const subUri = baseUri + '&$skip=' + i;
          observables.push(this.http.get(subUri));
        }
        return forkJoin(observables);

      }),
      map(data => {
        console.debug(data);
        return data;
      })
    );
  }
}
