// User interface
// Entry file
// gets data from UI and delegate actions to the other modules
/* eslint-disable */
// make some of the new JS feats work in all the browsers
// these js files can get data only from the pug templates
// (document.get().. or parameters that were sent from the template)
import '@babel/polyfill';

import { login, signUp, logout, forgotPassword, resetPassword, confirmEmail } from './login';

import { displayMap } from './mapbox';

import { updateSettings } from './updateSettings'

import { bookTour } from './stripe';

import { getPhoneNumber } from './2-step verification';

// DOM ELEMENTS 
const mapBox = document.getElementById('map');

const loginForm = document.querySelector('.form--login');
const signUpForm = document.querySelector('.form--signup');

const forgotPasswordForm = document.querySelector('.form--forgot');
const resetPasswordForm = document.querySelector('.form--reset');

const insertPhoneForm = document.querySelector('.form--insertPhone');

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

const confirmBtn = document.querySelector('.nav__el--con');
const logOutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
  }

// If there's a login form
if (loginForm) {
  loginForm.addEventListener('submit', e => {
  // when a form is submitted, we want to prevent
  // it from reloading the page...
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if(signUpForm) {
  signUpForm.addEventListener('submit', e => {
      e.preventDefault();
      let name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value; 
      signUp(name, email, password, passwordConfirm);
    });
} 

if(confirmBtn) {
  confirmBtn.addEventListener('click', confirmEmail);
};

if(logOutBtn) {
  logOutBtn.addEventListener('click', logout);
};

if(forgotPasswordForm) {
//  console.log('forgotpassform')
  forgotPasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;  
    forgotPassword(email);   
  });
}

if(resetPasswordForm) {
 //console.log('resetPassForm')
 resetPasswordForm.addEventListener('submit', e => {
  e.preventDefault();
  const password = document.getElementById('password').value; 
  const passwordConfirm = document.getElementById('passwordConfirm').value; 
  resetPassword(password, passwordConfirm);   
});
}

if(insertPhoneForm) {
  console.log('insert')
  insertPhoneForm.addEventListener('submit', e => {
   e.preventDefault();
   const phoneNumber = document.getElementById('tel').value; 
   getPhoneNumber(phoneNumber);
 });
 }

// If theres an user update form
if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    // formData constructs a set of key-value pairs,
    // with the format of multi-part/form-data,
    // this way it will be able to encode files
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    updateSettings(form, 'data');
  });
}

// password foem displayed
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
  
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    // every async function returns a promise
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  }); 
}

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    // taking param tourId from the pug template
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}