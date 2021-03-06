import {ChangeDetectionStrategy, Component, EventEmitter, Output} from '@angular/core';
import {FlickrDataService} from '../../services/flickr-data.service';
import {FlickrApiService} from '../../services/flickr-api.service';
import {catchError} from 'rxjs/operators';
import {EMPTY} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'grid-container',
  templateUrl: './grid-container.component.html',
  styleUrls: ['./grid-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridContainerComponent{

  @Output() searchWord = new EventEmitter<string>();

  constructor(private flickrApiService: FlickrApiService,
              private _snackBar: MatSnackBar,
              private flickrDataService: FlickrDataService,
  ) {}

  onTermOutput(event: string) {
    if(!event) {
      return;
    }
    this.flickrDataService.term.next(event);
    return this.flickrApiService.doPhotosReq(event, 'flickr.photos.search', 0)
      .pipe(
        catchError(err => {
          console.log(err);
          this._snackBar.open('API error ', err.statusCode??400, {duration: 3000});
          return EMPTY;
        })
      )
      .subscribe(res => {
        if (!res.photos?.pages) {
          this.flickrDataService.noContentTemplate.next(true);
        }
        this.flickrDataService.photos.next(this.flickrApiService.mapPhotos(res.photos.photo));
        ++this.flickrDataService.photoPage;
      });
  }
}
