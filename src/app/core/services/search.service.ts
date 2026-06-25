import { Injectable, computed, inject, signal } from '@angular/core';
import { ContentService } from './content.service';
import { LogicService } from './logic.service';
import { TopicMeta, LogicProblem } from '../models/content.model';

export interface SearchResult {
  topic: TopicMeta;
  score: number;
}

export interface LogicSearchResult { problem: LogicProblem; score: number; }

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly content = inject(ContentService);
  private readonly logic = inject(LogicService);
  readonly query = signal('');

  readonly results = computed<SearchResult[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/);
    const out: SearchResult[] = [];
    for (const topic of this.content.catalog()) {
      const haystackTitle = topic.title.toLowerCase();
      const haystackRest = (
        topic.description + ' ' + topic.category + ' ' +
        (topic.subcategory ?? '') + ' ' + topic.tags.join(' ')
      ).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystackTitle.includes(term)) score += haystackTitle.startsWith(term) ? 6 : 4;
        if (topic.tags.some(t => t.toLowerCase() === term)) score += 3;
        if (haystackRest.includes(term)) score += 1;
      }
      if (score > 0) out.push({ topic, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 12);
  });

  readonly logicResults = computed<LogicSearchResult[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/);
    const out: LogicSearchResult[] = [];
    for (const problem of this.logic.problems()) {
      const title = problem.title.toLowerCase();
      const rest = (problem.category + ' ' + problem.tags.join(' ')).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += title.startsWith(term) ? 6 : 4;
        if (problem.tags.some(t => t.toLowerCase() === term)) score += 3;
        if (rest.includes(term)) score += 1;
      }
      if (score > 0) out.push({ problem, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 6);
  });

  clear(): void { this.query.set(''); }
}
