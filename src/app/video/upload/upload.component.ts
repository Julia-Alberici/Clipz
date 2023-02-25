import { Component, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { last, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import firebase from 'firebase/compat/app';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {
  isDragover = false;
  file: File | null = null;
  showUploadAlert = false;
  alertMsg = 'Please wait, your clip is being uploaded.';
  alertColor = 'blue'
  inSubmission = false;
  percentage = 0;
  showPercentage = false;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService,
    private router: Router
    ) {
      auth.user.subscribe(user => this.user = user);
    }

  ngOnDestroy(): void {
    this.task?.cancel()
  }

  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
  nonNullable: true
})

  uploadForm = new FormGroup({
    title: this.title,
  })

  storeFile($event: Event) {
    this.isDragover = false;
    const file = ($event as DragEvent).dataTransfer
    ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null
    : ($event.target as HTMLInputElement).files?.item(0) ?? null

    if(!file || file.type !== 'video/mp4') {
      return
    }

    this.file = file
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''))
  }

  uploadFile() {
    this.uploadForm.disable()
    const clipFileName = uuid()
    const clipPath = `clips/${clipFileName}.mp4`
    this.showUploadAlert = true
    this.alertMsg = 'Please wait, your clip is being uploaded.'
    this.alertColor = 'blue'
    this.inSubmission = true
    this.showPercentage = true

    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);

    this.task.percentageChanges().subscribe(progress => {
      this.percentage = progress as number / 100
    })

    this.task.snapshotChanges().pipe(
      last(),
      switchMap(() => clipRef.getDownloadURL())
      ).subscribe({
      next: async (url) => {
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipFileName}.mp4`,
          url,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }

        const clipDocRef = await this.clipsService.createClip(clip)
        this.alertMsg = 'Success! Your clip is now ready to share with the world.'
        this.alertColor = 'green'
        this.showPercentage = false

        setTimeout(() => {
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        }, 1000)
      },
      error: (error) => {
        this.uploadForm.enable();
          this.alertMsg = 'Upload failed! Please try again later.'
          this.alertColor = 'red'
        this.inSubmission = false
        this.showPercentage = false
        console.error(error)
      }
    })
  }

}
