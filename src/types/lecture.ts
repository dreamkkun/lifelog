export interface LectureRecordInsert {
  user_id: string;
  type: 'LECTURE';
  target_date: string; // YYYY-MM-DD
  lecture_title: string;
  speaker?: string;
  content: string;
  image_urls: string[]; // Storage 객체 경로 ({userId}/{timestamp}_{uuid}.{ext})
  ocr_extracted_text?: string;
}

export type PipelineStage = 'IDLE' | 'OCR_PROCESSING' | 'STORAGE_UPLOADING' | 'COMPLETED' | 'ERROR';

export interface PipelineState {
  stage: PipelineStage;
  ocrProgress: number; // 0 ~ 100
  /** 업로드된 Storage 객체 경로. 표시용 서명 URL 은 TimelineEntry 와 ArchiveItemCard 가 useSignedUrls 로 발급한다. */
  uploadedImagePath: string | null;
  extractedText: string | null;
  errorMessage: string | null;
}

export interface PipelineResult {
  imagePath: string | null;
  /** null: OCR 엔진 오류, '': 인식된 글자 없음 */
  text: string | null;
}
