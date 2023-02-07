import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  }

  inSubmission = false;

  constructor(private auth: AngularFireAuth) { }

  ngOnInit(): void {
  }

  showAlert = false
  alertMsg = 'Please wait! Your account is being logged in.'
  alertColor = 'blue'

  async login(){
    this.showAlert = true
    this.alertMsg = 'Please wait! You\'re being logged in.'
    this.alertColor = 'blue'
    this.inSubmission = true;

    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email, this.credentials.password
        )
      }catch {
      this.showAlert = true
      this.alertMsg = 'An unexpected error occurred. Please try again later.'
      this.alertColor = 'red'
      this.inSubmission = false;
      return;
    }
    this.alertMsg = "You're logged in."
    this.alertColor = 'green'
  }

}


