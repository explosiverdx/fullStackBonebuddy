import 'package:flutter_test/flutter_test.dart';
import 'package:bone_buddy_app/models/session_model.dart';

void main() {
  group('SessionModel', () {
    test('should create SessionModel from JSON with all fields', () {
      final json = {
        '_id': 'session123',
        'patientId': 'patient123',
        'patientName': 'John Doe',
        'physiotherapistId': 'physio123',
        'physiotherapistName': 'Jane Smith',
        'doctorId': 'doctor123',
        'doctorName': 'Dr. Bob',
        'sessionDate': '2024-01-15T10:00:00Z',
        'scheduledDate': '2024-01-15T10:00:00Z',
        'status': 'active',
        'sessionType': 'in-person',
        'sessionVideo': 'https://example.com/video.mp4',
        'videoUrl': 'https://example.com/video.mp4',
        'notes': 'Session notes',
        'startTime': '2024-01-15T10:00:00Z',
        'endTime': '2024-01-15T11:00:00Z',
        'durationMinutes': 60,
        'actualDuration': 58,
        'surgeryType': 'Knee Replacement',
        'createdAt': '2024-01-10T08:00:00Z',
        'updatedAt': '2024-01-15T11:00:00Z',
      };

      final session = SessionModel.fromJson(json);

      expect(session.id, 'session123');
      expect(session.patientId, 'patient123');
      expect(session.patientName, 'John Doe');
      expect(session.physiotherapistId, 'physio123');
      expect(session.physiotherapistName, 'Jane Smith');
      expect(session.doctorId, 'doctor123');
      expect(session.doctorName, 'Dr. Bob');
      expect(session.status, 'active');
      expect(session.sessionType, 'in-person');
      expect(session.sessionVideo, 'https://example.com/video.mp4');
      expect(session.videoUrl, 'https://example.com/video.mp4');
      expect(session.notes, 'Session notes');
      expect(session.durationMinutes, 60);
      expect(session.actualDuration, 58);
      expect(session.surgeryType, 'Knee Replacement');
    });

    test('should handle populated patientId object', () {
      final json = {
        '_id': 'session123',
        'patientId': {
          '_id': 'patient123',
          'Fullname': 'John Doe',
        },
      };

      final session = SessionModel.fromJson(json);
      expect(session.patientId, 'patient123');
      expect(session.patientName, 'John Doe');
    });

    test('should handle sessionVideo as object with url', () {
      final json = {
        '_id': 'session123',
        'sessionVideo': {
          'url': 'https://example.com/video.mp4',
        },
      };

      final session = SessionModel.fromJson(json);
      expect(session.sessionVideo, 'https://example.com/video.mp4');
      expect(session.videoUrl, 'https://example.com/video.mp4');
    });

    test('should identify status correctly', () {
      final pendingSession = SessionModel(
        id: '1',
        status: 'pending',
      );
      expect(pendingSession.isPending, true);
      expect(pendingSession.isActive, false);
      expect(pendingSession.isCompleted, false);
      expect(pendingSession.isCancelled, false);
      expect(pendingSession.isMissed, false);

      final activeSession = SessionModel(
        id: '2',
        status: 'active',
        sessionVideo: 'https://example.com/video.mp4',
      );
      expect(activeSession.isActive, true);
      expect(activeSession.canJoinVideo, true);

      final completedSession = SessionModel(
        id: '3',
        status: 'completed',
      );
      expect(completedSession.isCompleted, true);
      expect(completedSession.canJoinVideo, false);
    });

    test('should check canJoinVideo correctly', () {
      final sessionWithVideo = SessionModel(
        id: '1',
        status: 'active',
        sessionVideo: 'https://example.com/video.mp4',
      );
      expect(sessionWithVideo.canJoinVideo, true);

      final sessionWithoutVideo = SessionModel(
        id: '2',
        status: 'active',
      );
      expect(sessionWithoutVideo.canJoinVideo, false);

      final pendingSession = SessionModel(
        id: '3',
        status: 'pending',
        sessionVideo: 'https://example.com/video.mp4',
      );
      expect(pendingSession.canJoinVideo, true);
    });

    test('should convert SessionModel to JSON', () {
      final session = SessionModel(
        id: 'session123',
        patientId: 'patient123',
        patientName: 'John Doe',
        status: 'active',
        sessionType: 'in-person',
        videoUrl: 'https://example.com/video.mp4',
        notes: 'Session notes',
        scheduledDate: DateTime.parse('2024-01-15T10:00:00Z'),
        createdAt: DateTime.parse('2024-01-10T08:00:00Z'),
        updatedAt: DateTime.parse('2024-01-15T11:00:00Z'),
      );

      final json = session.toJson();

      expect(json['_id'], 'session123');
      expect(json['patientId'], 'patient123');
      expect(json['patientName'], 'John Doe');
      expect(json['status'], 'active');
      expect(json['sessionType'], 'in-person');
      expect(json['videoUrl'], 'https://example.com/video.mp4');
      expect(json['notes'], 'Session notes');
    });

    test('should use displayDate correctly', () {
      final sessionWithSessionDate = SessionModel(
        id: '1',
        sessionDate: DateTime.parse('2024-01-15T10:00:00Z'),
        scheduledDate: DateTime.parse('2024-01-14T10:00:00Z'),
      );
      expect(sessionWithSessionDate.displayDate, DateTime.parse('2024-01-15T10:00:00Z'));

      final sessionWithoutSessionDate = SessionModel(
        id: '2',
        scheduledDate: DateTime.parse('2024-01-14T10:00:00Z'),
      );
      expect(sessionWithoutSessionDate.displayDate, DateTime.parse('2024-01-14T10:00:00Z'));
    });

    test('should handle alternate field names', () {
      final json = {
        'id': 'session123',
        'physio': {
          '_id': 'physio123',
          'name': 'Jane Smith',
        },
        'doctor': {
          '_id': 'doctor123',
          'Fullname': 'Dr. Bob',
        },
        'patient': {
          '_id': 'patient123',
        },
      };

      final session = SessionModel.fromJson(json);
      expect(session.physioId, 'physio123');
      expect(session.physiotherapistName, 'Jane Smith');
      expect(session.doctorId, 'doctor123');
      expect(session.doctorName, 'Dr. Bob');
      expect(session.patientId, 'patient123');
    });

    test('should default sessionType to in-person', () {
      final json = {
        '_id': 'session123',
      };

      final session = SessionModel.fromJson(json);
      expect(session.sessionType, 'in-person');
    });
  });
}
