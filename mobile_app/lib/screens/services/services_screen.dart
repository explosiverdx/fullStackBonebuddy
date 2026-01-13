import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../utils/helpers.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  final List<Map<String, dynamic>> _services = const [
    {
      'id': 'knee-replacement-rehab',
      'title': 'Knee Replacement Rehab',
      'description': 'A 25-session plan progressing from acute pain relief to advanced training, ensuring a safe and reliable return to daily life.',
      'image': '/assets/Services/Services (6).jpeg',
    },
    {
      'id': 'spinal-surgery-rehab',
      'title': 'Spinal Surgery Rehab',
      'description': 'A surgeon-supervised program focused on pain management, core stabilization, and safe functional movement after spinal surgery.',
      'image': '/assets/Services/Spinal Surgery.jpg',
    },
    {
      'id': 'hip-replacement-rehab',
      'title': 'Hip Replacement Rehab',
      'description': 'Ensures a safe recovery by focusing on pain control, improving range of motion, and building strength while adhering to surgical precautions.',
      'image': '/assets/Services/Hip Replacement.jpg',
    },
    {
      'id': 'ankle-surgery-rehab',
      'title': 'Ankle Surgery Rehab',
      'description': 'A 25-session plan to control pain and swelling, restore mobility and strength, and enhance stability for a safe return to daily life and sports.',
      'image': '/assets/Services/Services (2).jpeg',
    },
    {
      'id': 'elbow-surgery-rehab',
      'title': 'Elbow Surgery Rehab',
      'description': 'This plan focuses on controlling pain, initiating safe mobilization, and progressing to advanced strengthening to regain full function.',
      'image': '/assets/Services/Services (11).jpeg',
    },
    {
      'id': 'wrist-surgery-rehab',
      'title': 'Wrist Surgery Rehab',
      'description': 'A structured program to manage pain, restore mobility, and improve grip strength and dexterity for a full return to daily tasks and work.',
      'image': '/assets/Services/Services (5).jpeg',
    },
    {
      'id': 'shoulder-surgery-rehab',
      'title': 'Shoulder Surgery Rehab',
      'description': 'A phased approach to restore mobility and stability, progressing from pain control to advanced strengthening and a full return to daily activities.',
      'image': '/assets/Services/Services (12).jpeg',
    },
    {
      'id': 'trauma-post-surgery',
      'title': 'Trauma Post-Surgery',
      'description': 'A phase-wise recovery plan for fractures and polytrauma, tailored to progress from acute pain management to functional training under surgeon clearance.',
      'image': '/assets/Services/Services (9).jpeg',
    },
    {
      'id': 'sports-injury-recovery',
      'title': 'Sports Injury Recovery',
      'description': 'A dedicated plan to help athletes return to play safely, progressing from pain control to sport-specific drills and injury prevention strategies.',
      'image': '/assets/Services/Services (10).jpeg',
    },
    {
      'id': 'neurosurgery-rehab',
      'title': 'Neurosurgery Rehab',
      'description': 'A part-wise recovery program focused on pain control, safe mobilization, and restoring functional independence under surgeon-approved protocols.',
      'image': '/assets/Services/Neurosurgery.jpg',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Our Services'),
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.75,
        ),
        itemCount: _services.length,
        itemBuilder: (context, index) {
          final service = _services[index];
          return GestureDetector(
            onTap: () => context.push('/services/${service['id']}'),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      child: Image.network(
                        Helpers.getImageUrl(service['image']),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[300],
                            child: const Icon(Icons.medical_services, size: 50),
                          );
                        },
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service['title'] as String,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          service['description'] as String,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[600],
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 1),
    );
  }
}

