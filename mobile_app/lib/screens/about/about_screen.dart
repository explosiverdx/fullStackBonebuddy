import 'package:flutter/material.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../utils/helpers.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About Us'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // BoneBuddy Content Section
            _buildContentSection(),
            
            // Why Choose BoneBuddy Section
            _buildWhyChooseSection(),
            
            // Why BoneBuddy is Different Section
            _buildWhyDifferentSection(),
          ],
        ),
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 0),
    );
  }
  
  Widget _buildContentSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "BoneBuddy - India's Premium Post Operative Doorstep Physiotherapy Services",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "At BoneBuddy, we believe in transforming recovery into a powerful, personalized experience. Our expert physiotherapists guide you through tailored therapies that not only heal but empower you to regain strength, confidence, and independence. From post-surgical rehabilitation to sports injury recovery, every step is designed to accelerate your healing and restore your quality of life.",
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "BoneBuddy connects you with qualified and experienced physiotherapy specialists who bring years of expertise in post operative ortho and Neuro Rehabilitation and recovery to routine. Our platform ensures personalized treatment plans designed to improve your health and provide the best possible care with expert support.",
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildWhyChooseSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Why Choose BoneBuddy?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ...['Personalized treatment plans crafted by certified experts',
              'State-of-the-art facilities and modern rehabilitation techniques',
              'Comprehensive care from initial assessment to full recovery',
              'Focus on long-term wellness and injury prevention',
          ].map((point) => Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    point,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                ),
              ],
            ),
          )),
          const SizedBox(height: 16),
          // Image
          Container(
            width: double.infinity,
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                Helpers.getImageUrl('/assets/physiotherapy-treatment_3.jpg'),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const Center(
                    child: Icon(Icons.image, size: 60, color: Colors.grey),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildWhyDifferentSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(
            child: Text(
              'Why BoneBuddy is Different',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 24),
          // BoneBuddy Column
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'BoneBuddy',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...[
                    'Doctor-Connected protocols designed by Orthopedic Surgeons.',
                    'Evidence-Based Protocols (AAOS/WHO) with phase-wise recovery.',
                    'App + Doorstep Care including telerehabilitation and manual therapy.',
                    'Digital Progress Tracking with reports shared directly with doctors.',
                    '24/7 support with online consultations available.',
                    'Standardized, structured protocols for safety and effectiveness.',
                    'Direct integration with hospital EMRs for seamless care.',
                  ].map((point) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '✔',
                          style: TextStyle(color: Colors.green, fontSize: 16),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            point,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Local Physiotherapist Column
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Local Physiotherapist',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...[
                    'Physiotherapist-driven only, with no multidisciplinary involvement.',
                    'Exercises may not follow evidence-based guidelines.',
                    'Limited to in-person visits without integrated app support.',
                    'No structured clinical outcome measurement or reporting.',
                    'Support is limited to clinic hours.',
                    'Treatment methods can vary and may lack structure.',
                    'No integration with hospital systems or referring doctors.',
                  ].map((point) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '✖',
                          style: TextStyle(color: Colors.red, fontSize: 16),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            point,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

