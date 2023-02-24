import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { last, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import firebase from 'firebase/compat/app';
import { ClipService } from 'src/app/services/clip.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  isDragover = false;
  file: File | null = null;
  showUploadAlert = false;
  alertMsg = 'Please wait, your clip is being uploaded.';
  alertColor = 'blue'
  inSubmission = false;
  percentage = 0;
  showPercentage = false;
  user: firebase.User | null = null;

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService
    ) {
      auth.user.subscribe(user => this.user = user);
    }

  ngOnInit(): void {
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
    const file = ($event as DragEvent).dataTransfer?.files.item(0) ?? null

    if(!file || file.type !== 'video/mp4') {
      return
    }

    this.file = file
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''))
  }

  uploadFile() {
    const clipFileName = uuid()
    const clipPath = `clips/${clipFileName}.mp4`
    this.showUploadAlert = true
    this.alertMsg = 'Please wait, your clip is being uploaded.'
    this.alertColor = 'blue'
    this.inSubmission = true
    this.showPercentage = true

    const task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);

    task.percentageChanges().subscribe(progress => {
      this.percentage = progress as number / 100
    })

    task.snapshotChanges().pipe(
      last(),
      switchMap(() => clipRef.getDownloadURL())
      ).subscribe({
      next: (url) => {
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipFileName}.mp4`,
          url
        }

        this.clipsService.createClip(clip)
        console.log(clip)
        this.alertMsg = 'Success! Your clip is now ready to share with the world.'
        this.alertColor = 'green'
        this.showPercentage = false
      },
      error: (error) => {
          this.alertMsg = 'Upload failed! Please try again later.'
          this.alertColor = 'red'
        this.inSubmission = false
        this.showPercentage = false
        console.error(error)
      }
    })
  }

}
