import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let svc: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ProgressService);
  });

  it('toggles topic completion', () => {
    expect(svc.isTopicComplete('t1')).toBeFalse();
    svc.toggleTopic('t1');
    expect(svc.isTopicComplete('t1')).toBeTrue();
    svc.toggleTopic('t1');
    expect(svc.isTopicComplete('t1')).toBeFalse();
  });

  it('tracks question status, mutually exclusive and toggleable', () => {
    svc.toggleQuestion('q1', 'known');
    expect(svc.questionStatus('q1')).toBe('known');
    svc.toggleQuestion('q1', 'review');
    expect(svc.questionStatus('q1')).toBe('review');
    expect(svc.reviewIds()).toEqual(['q1']);
    expect(svc.reviewCount()).toBe(1);
    svc.toggleQuestion('q1', 'review'); // toggling the active status clears it
    expect(svc.questionStatus('q1')).toBeUndefined();
    expect(svc.reviewCount()).toBe(0);
  });

  it('computes granular topic completion from known questions + solved challenges', () => {
    svc.toggleQuestion('q1', 'known');
    svc.toggleQuestion('q2', 'known');
    svc.toggleChallenge('c1');
    // 2 known questions + 1 solved challenge out of (3 questions + 1 challenge) = 0.75
    expect(svc.topicCompletion(['q1', 'q2', 'q3'], ['c1'])).toBeCloseTo(0.75, 5);
    expect(svc.topicCompletion([], [])).toBe(0);
  });

  it('exports and re-imports progress round-trip', () => {
    svc.toggleTopic('t1');
    svc.toggleChallenge('c1');
    svc.toggleQuestion('q1', 'review');
    const json = svc.exportData();

    svc.reset();
    expect(svc.completedCount()).toBe(0);
    expect(svc.reviewCount()).toBe(0);

    expect(svc.importData(json)).toBeTrue();
    expect(svc.isTopicComplete('t1')).toBeTrue();
    expect(svc.isChallengeSolved('c1')).toBeTrue();
    expect(svc.questionStatus('q1')).toBe('review');
  });

  it('rejects invalid import payloads', () => {
    expect(svc.importData('not json')).toBeFalse();
    expect(svc.importData('{"foo":1}')).toBeFalse();
  });

  it('migrates from the v1 storage shape', () => {
    localStorage.clear();
    localStorage.setItem('dmh.progress.v1', JSON.stringify({
      completedTopics: ['old-topic'],
      solvedChallenges: ['old-challenge'],
    }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const migrated = TestBed.inject(ProgressService);
    expect(migrated.isTopicComplete('old-topic')).toBeTrue();
    expect(migrated.isChallengeSolved('old-challenge')).toBeTrue();
  });
});
