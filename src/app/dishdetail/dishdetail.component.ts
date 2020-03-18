import { Component, OnInit, ViewChild , Inject} from '@angular/core';
import { Dish } from '../shared/dish'

import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';

import { Params , ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { FormBuilder , FormGroup , Validators } from '@angular/forms';
import { Comment } from '../shared/comment';

import { MatSliderChange } from '@angular/material';




@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss']
})
export class DishdetailComponent implements OnInit {

  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  dishcopy: Dish;
  slider_value: number;

  CommentForm: FormGroup;
  Comment: Comment;
  @ViewChild('cform') commentFormDirective;

  formErrors = {
    'rating': '',
    'comment': '',
    'author': ''
  };

  slider_rating = {
    'max' : 5,
    'min' : 0,
    'tickInterval' : 1,
    'step' : 1,
    'thumbLabel' : true,
    'value' : 5,
  }

  validationMessages = {
    'author': {
      'required': 'author name is required.',
      'minLength': 'author name must be atleast 2 characters long'
     },
     'comment': {
      'required': 'comment is required.'
     },
     'rating': {
      'required': 'rating is required.'
    },
  };
  
  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) { 
      this.createForm();
    }

  ngOnInit() {
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => this.dishservice.getDish(params['id'])))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish ; this.setPrevNext(dish.id); },
      errmess => this.errMess = <any>errmess );
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

  createForm() {
    this.CommentForm = this.fb.group({
      rating: [''],
      comment: ['', Validators.required],
      author: ['', [Validators.required,  Validators.minLength(2)]]
    });

    this.CommentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re) set form validation messages
  }

  onValueChanged(data?: any) {
    if (!this.CommentForm) { return; }
    const form = this.CommentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit(){
    this.Comment = this.CommentForm.value;
    this.Comment.date = new Date().toISOString();

    this.Comment.rating = this.slider_rating.value;

    console.log(this.Comment);
    // push comment
    this.dishcopy.comments.push(this.Comment);
    this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish;
        this.dishcopy = dish;
      },
      errmess => {this.errMess = <any>errmess;
       this.dish = null; this.dishcopy = null;});

    this.CommentForm.reset({
      rating: '',
      comment: '',
      author: ''
    });
    this.commentFormDirective.resetForm();
    this.slider_rating.value = 5;
  }

  onSliderChange(event: MatSliderChange) {
    console.log(event.value);
    this.slider_rating.value = event.value;
  }

}
