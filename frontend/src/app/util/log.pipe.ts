import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'log'
})
export class LogPipe implements PipeTransform {

  transform(value: any): unknown {
    console.debug(value);
    return value;
  }

}
