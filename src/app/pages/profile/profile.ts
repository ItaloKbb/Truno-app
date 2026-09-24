import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../../components/avatar/avatar';
import { ProfileStorage } from '../../services/profile-storage';
@Component({
  imports: [Avatar, RouterLink],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly user = inject(ProfileStorage).loadProfile();
}
