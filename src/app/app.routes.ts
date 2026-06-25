import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · DevMaster Hub',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'topics',
        title: 'Topics · DevMaster Hub',
        loadComponent: () => import('./features/topics/topic-list.component').then(m => m.TopicListComponent),
      },
      {
        path: 'topics/:id',
        loadComponent: () => import('./features/topics/topic-detail.component').then(m => m.TopicDetailComponent),
      },
      {
        path: 'interview',
        title: 'Interview Mode · DevMaster Hub',
        loadComponent: () => import('./features/interview/interview.component').then(m => m.InterviewComponent),
      },
      {
        path: 'challenges',
        title: 'Challenges · DevMaster Hub',
        loadComponent: () => import('./features/challenges/challenge-list.component').then(m => m.ChallengeListComponent),
      },
      {
        path: 'challenges/:id',
        loadComponent: () => import('./features/challenges/challenge-detail.component').then(m => m.ChallengeDetailComponent),
      },
      {
        path: 'progress',
        title: 'Progress · DevMaster Hub',
        loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent),
      },
      {
        path: 'settings',
        title: 'Settings · DevMaster Hub',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
