import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../utils/service_content_data.dart';
import '../../utils/helpers.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../models/service_content_model.dart';

class ServiceDetailScreen extends StatelessWidget {
  final String serviceId;
  
  const ServiceDetailScreen({super.key, required this.serviceId});

  @override
  Widget build(BuildContext context) {
    final serviceContent = ServiceContentData.getServiceContent(serviceId);
    
    if (serviceContent == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Service Details'),
        ),
        body: const Center(
          child: Text('Service content not found'),
        ),
        bottomNavigationBar: const BottomNavBar(currentIndex: 1),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Details'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Service Image
            Image.network(
              Helpers.getImageUrl(serviceContent.image),
              height: 250,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: 250,
                  color: Colors.grey[300],
                  child: const Icon(Icons.medical_services, size: 60),
                );
              },
            ),
            
            // Content Sections
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    serviceContent.title,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0066CC),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Render all sections
                  ...serviceContent.sections.map((section) {
                    return _buildSection(section);
                  }),
                  
                  const SizedBox(height: 24),
                  
                  // Contact CTA
                  Card(
                    color: const Color(0xFF0066CC),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          const Text(
                            'Ready to Start Recovery?',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Contact us today to book your personalized rehabilitation plan',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white70,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => context.push('/contact'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF0066CC),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 32,
                                vertical: 16,
                              ),
                            ),
                            child: const Text(
                              'Book Your Rehab Plan',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 1),
    );
  }
  
  Widget _buildSection(ServiceSection section) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          if (section.title.isNotEmpty) ...[
            Text(
              section.title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
          ],
          
          // Section Content
          if (section.content != null && section.content!.isNotEmpty) ...[
            Text(
              section.content!,
              style: const TextStyle(
                fontSize: 16,
                height: 1.6,
                color: Colors.black87,
              ),
            ),
            if (section.bulletPoints != null) const SizedBox(height: 12),
          ],
          
          // Subtitle before bullets
          if (section.subtitle != null && section.subtitle!.isNotEmpty) ...[
            Text(
              section.subtitle!,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
          ],
          
          // Bullet Points
          if (section.bulletPoints != null && section.bulletPoints!.isNotEmpty) ...[
            ...section.bulletPoints!.map((point) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0, left: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '• ',
                      style: TextStyle(
                        fontSize: 20,
                        color: Color(0xFF0066CC),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        point,
                        style: const TextStyle(
                          fontSize: 16,
                          height: 1.5,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
