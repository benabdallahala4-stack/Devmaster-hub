import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContentService } from './content.service';
import { TopicMeta } from '../models/content.model';

function meta(id: string, category: string, q: number, c: number): TopicMeta {
  return { id, title: id.toUpperCase(), category, difficulty: 'mid', tags: [], description: '', estReadMinutes: 10, questionCount: q, challengeCount: c };
}

describe('ContentService', () => {
  let svc: ContentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(ContentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the catalog and aggregates totals', () => {
    svc.loadCatalog().subscribe();
    http.expectOne('assets/data/index.json').flush([
      meta('a', 'Backend', 2, 1),
      meta('b', 'Frontend', 3, 1),
    ]);

    expect(svc.totalTopics()).toBe(2);
    expect(svc.totalQuestions()).toBe(5);
    expect(svc.totalChallenges()).toBe(2);
    expect(svc.meta('a')?.title).toBe('A');
  });

  it('groups topics by category in the configured display order', () => {
    svc.loadCatalog().subscribe();
    http.expectOne('assets/data/index.json').flush([
      meta('a', 'Backend', 1, 0),
      meta('b', 'Frontend', 1, 0),
      meta('c', 'Cloud', 1, 0),
    ]);

    // CATEGORY_ORDER: Frontend, Backend, ... , Cloud
    expect(svc.groups().map(g => g.name)).toEqual(['Frontend', 'Backend', 'Cloud']);
  });
});
