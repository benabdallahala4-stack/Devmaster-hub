import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChallengeService } from './challenge.service';
import { Challenge } from '../models/content.model';

describe('ChallengeService', () => {
  let svc: ChallengeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(ChallengeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('merges authored and imported challenges into one list', () => {
    let result: Challenge[] = [];
    svc.load().subscribe(list => (result = list));

    http.expectOne('assets/data/challenges.json').flush([
      { id: 'a', title: 'A', difficulty: 'mid', category: 'X', prompt: '', hints: [], solutionCode: 'x', solutionLanguage: 'js', explanation: 'e' },
    ]);
    http.expectOne('assets/data/challenges.imported.json').flush([
      { id: 'ex-b', title: 'B', difficulty: 'junior', category: 'Y', prompt: '', hints: [], solutionCode: 'y', solutionLanguage: 'javascript', explanation: 'e' },
    ]);

    expect(result.length).toBe(2);
    expect(svc.byId('ex-b')).toBeTruthy();
    expect(svc.categories()).toEqual(['X', 'Y']);
  });

  it('tolerates a missing imported file', () => {
    let result: Challenge[] = [];
    svc.load().subscribe(list => (result = list));

    http.expectOne('assets/data/challenges.json').flush([
      { id: 'a', title: 'A', difficulty: 'mid', category: 'X', prompt: '', hints: [], solutionCode: 'x', solutionLanguage: 'js', explanation: 'e' },
    ]);
    http.expectOne('assets/data/challenges.imported.json').error(new ProgressEvent('404'));

    expect(result.length).toBe(1);
    expect(svc.byId('a')).toBeTruthy();
  });
});
