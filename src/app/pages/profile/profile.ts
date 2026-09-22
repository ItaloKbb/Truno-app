import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { profileUser } from './profile.data';
@Component({
  imports: [RouterLink],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly user = profileUser;
}
