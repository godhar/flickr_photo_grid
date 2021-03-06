import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {BehaviorSubject, EMPTY, Observable} from 'rxjs';
import {PhotoConfig} from '../../models/photo-config';
import {faLongArrowAltUp} from '@fortawesome/free-solid-svg-icons';
import {catchError, tap} from 'rxjs/operators';
import {FlickrApiService} from '../../services/flickr-api.service';
import {FlickrDataService} from '../../services/flickr-data.service';
import {OnDestroyMixin, untilComponentDestroyed} from '@w11k/ngx-componentdestroyed';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-photo-mill',
  templateUrl: './photo-mill.component.html',
  styleUrls: ['./photo-mill.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoMillComponent extends OnDestroyMixin implements OnInit {
  faLongArrowAltUp = faLongArrowAltUp;
  page = 0;
  results: Observable<boolean> | undefined;
  noContentTemplate = new BehaviorSubject(false);
  photos: Array<PhotoConfig> = [];
  throttle = 0;
  distance = 2;

  constructor(private flickrApiService: FlickrApiService,
              private flickrDataService: FlickrDataService,
              private changeDetectorRef: ChangeDetectorRef,
              private _snackBar: MatSnackBar,
  ) {
    super();
  }

  ngOnInit(): void {
    this.flickrDataService.photos.pipe(
      untilComponentDestroyed(this)).subscribe((p) => {
      this.photos = p;
    });
    this.results = this.flickrDataService.noContentTemplate.asObservable();
  }

  onScroll(): void {
    console.log("scrolling!")
    // if (this.flickrDataService.photoPage === 1 || !this.flickrDataService.term.value) {
    //   return;
    // }
    this.flickrApiService.doPhotosReq(this.flickrDataService.term.value, 'flickr.photos.search', ++this.page)
      .pipe(
        catchError(err => {
          this._snackBar.open('API error ', err.statusCode ?? 400, {duration: 3000});
          return EMPTY;
        }),
        tap(() => this.flickrDataService.spinner.next(true)))
      .subscribe(res => {
        if ((res as any).photos?.photo) {
          const photosWithSrc = this.flickrApiService.mapPhotos(res.photos.photo);
          this.flickrDataService.photos.next([...this.flickrDataService.photos.value].concat(photosWithSrc));
          this.changeDetectorRef.detectChanges();
        }
      });
  }
}
