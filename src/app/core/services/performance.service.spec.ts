import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PerformanceService } from './performance.service';
import {
  CreatePerformanceReviewRequest,
  PageResponse,
  PerformanceReview,
  SaveCriterionRequest,
} from '../../domain/models/performance.model';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let httpMock: HttpTestingController;

  const review: PerformanceReview = {
    id: 1,
    employeeId: 5,
    employeeName: 'Jane Doe',
    reviewPeriod: 'Q1-2026',
    reviewDate: '2026-03-31',
    status: 'DRAFT',
    overallScore: 82.5,
    evaluations: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PerformanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch reviews with pagination and optional filters', () => {
    const page: PageResponse<PerformanceReview> = {
      content: [review],
      page: 2,
      size: 25,
      totalElements: 51,
      totalPages: 3,
    };

    service
      .getReviews({ page: 2, size: 25, status: 'APPROVED', employeeId: 5, period: 'Q1-2026' })
      .subscribe(response => expect(response).toEqual(page));

    const req = httpMock.expectOne(request =>
      request.url === '/api/performance-reviews' &&
      request.params.get('page') === '2' &&
      request.params.get('size') === '25' &&
      request.params.get('status') === 'APPROVED' &&
      request.params.get('employeeId') === '5' &&
      request.params.get('period') === 'Q1-2026' &&
      request.params.get('dateFrom') === null
    );
    expect(req.request.method).toBe('GET');
    req.flush(page);
  });

  it('should default to page 1 and size 10 when no filters given', () => {
    service.getReviews().subscribe();

    const req = httpMock.expectOne(
      request =>
        request.url === '/api/performance-reviews' &&
        request.params.get('page') === '1' &&
        request.params.get('size') === '10'
    );
    req.flush({ content: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('should create a review via POST', () => {
    const request: CreatePerformanceReviewRequest = {
      employeeId: 5,
      reviewPeriod: 'Q1-2026',
      reviewDate: '2026-03-31',
      evaluations: [{ criterionId: 1, score: 80 }],
    };

    service.createReview(request).subscribe(response => expect(response).toEqual(review));

    const req = httpMock.expectOne('/api/performance-reviews');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(review);
  });

  it('should update, submit and approve reviews on the right endpoints', () => {
    service.updateReview(1, { reviewPeriod: 'Q2-2026', evaluations: [] }).subscribe();
    let req = httpMock.expectOne('/api/performance-reviews/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...review, reviewPeriod: 'Q2-2026' });

    service.submitReview(1).subscribe();
    req = httpMock.expectOne('/api/performance-reviews/1/submit');
    expect(req.request.method).toBe('POST');
    req.flush({ ...review, status: 'COMPLETED' });

    service.approveReview(1).subscribe();
    req = httpMock.expectOne('/api/performance-reviews/1/approve');
    expect(req.request.method).toBe('POST');
    req.flush({ ...review, status: 'APPROVED' });
  });

  it('should delete a review', () => {
    service.deleteReview(1).subscribe();

    const req = httpMock.expectOne('/api/performance-reviews/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should fetch stats and employee performance summaries', () => {
    service.getStats().subscribe();
    let req = httpMock.expectOne('/api/performance-reviews/stats');
    expect(req.request.method).toBe('GET');
    req.flush({});

    service.getEmployeePerformance(7).subscribe();
    req = httpMock.expectOne('/api/employees/7/performance');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should manage criteria with the activeOnly flag', () => {
    const criterionRequest: SaveCriterionRequest = {
      name: 'Teamwork',
      weight: 3,
      active: true,
    };

    service.getCriteria(true).subscribe();
    let req = httpMock.expectOne(
      request => request.url === '/api/performance-criteria' && request.params.get('activeOnly') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);

    service.createCriterion(criterionRequest).subscribe();
    req = httpMock.expectOne('/api/performance-criteria');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(criterionRequest);
    req.flush({ id: 9, ...criterionRequest });

    service.updateCriterion(9, criterionRequest).subscribe();
    req = httpMock.expectOne('/api/performance-criteria/9');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 9, ...criterionRequest });

    service.deleteCriterion(9).subscribe();
    req = httpMock.expectOne('/api/performance-criteria/9');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
