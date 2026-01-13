import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:dio/dio.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../utils/helpers.dart';
import '../../models/physio_model.dart';
import '../../services/physio_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentSlide = 0;
  int _currentTestimonialIndex = 0;
  int _currentPhysioIndex = 0;
  late final PageController _testimonialPageController = PageController(initialPage: 0);
  late final PageController _physioPageController = PageController(initialPage: 0);
  final PhysioService _physioService = PhysioService();
  List<PhysioModel> _physiotherapists = [];
  bool _isLoadingPhysios = true;
  String? _physioError;
  
  final List<String> _slides = [
    'assets/images/carousel/Carousel_1.png',
    'assets/images/carousel/CArousel_2.png',
    'assets/images/carousel/Carousel_3.png',
    'assets/images/carousel/Carousel_4.png',
  ];
  
  final List<Map<String, dynamic>> _testimonials = [
    {
      'name': 'Snehlata Singh',
      'rating': 5,
      'text': "After my femur bone fracture, I was nervous about recovery. With BoneBuddy, I got expert, highly experienced, and specially trained post surgery Physiotherapist, at home, along with regular monitoring. My doctor could track my progress on BoneBuddy App. Within three months I was walking confidently. Truly life changing",
    },
    {
      'name': 'Faizaan Ahmad',
      'rating': 5,
      'text': "Choosing BoneBuddy Physiotherapy for my post-operative ACL reconstruction rehabilitation was the best decision I made for my recovery. My therapist, Dr Ashish Shetty, was incredibly knowledgeable, bringing all the necessary equipment and ensuring every session was focused, safe, and effective.",
    },
    {
      'name': 'Haroon Khan',
      'rating': 5,
      'text': "My knee was operated by Dr Rizwan. He referred to take my physiotherapy sessions from BoneBuddy Premium physiotherapy services. BoneBuddy deputed Dr Laxmi Physiotherapist to provide sessions at my home in the Village with in 24 hours. I am fully satisfied with the recovery.",
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadPhysiotherapists();
    _startTestimonialAutoSlide();
  }

  void _startTestimonialAutoSlide() {
    // Auto-slide testimonials every 4 seconds (matching website)
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _testimonials.isNotEmpty) {
        final nextIndex = (_currentTestimonialIndex + 1) % _testimonials.length;
        _testimonialPageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
        _startTestimonialAutoSlide(); // Continue auto-sliding
      }
    });
  }

  void _startPhysioAutoSlide() {
    // Auto-slide physiotherapists every 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _physiotherapists.isNotEmpty && !_isLoadingPhysios) {
        final totalPages = (_physiotherapists.length / 2).ceil();
        if (totalPages > 1) { // Only auto-slide if there's more than 1 page
          final nextIndex = (_currentPhysioIndex + 1) % totalPages;
          print('Auto-sliding physiotherapists to page $nextIndex of $totalPages');
          if (_physioPageController.hasClients) {
            _physioPageController.animateToPage(
              nextIndex,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            );
          }
          _startPhysioAutoSlide(); // Continue auto-sliding
        } else {
          // If only one page, restart the delay anyway
          _startPhysioAutoSlide();
        }
      }
    });
  }
  
  @override
  void dispose() {
    _testimonialPageController.dispose();
    _physioPageController.dispose();
    super.dispose();
  }

  // Manual physiotherapists list matching the website (Home.jsx) exactly
  // These are the profiles manually created in code to show on website
  List<PhysioModel> get _websitePhysiotherapists {
    return [
      PhysioModel(
        id: '1',
        name: 'Dr. Avneesh Dixit',
        qualification: 'BPT',
        specialization: 'Chief Physiotherapist',
        experience: '15 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr Avneesh Dixit.jpeg',
      ),
      PhysioModel(
        id: '2',
        name: 'Dr. Mazhar',
        qualification: 'BPT',
        specialization: 'Specialist in Ortho & Neuro',
        experience: '17 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr Mazhar.jpg',
      ),
      PhysioModel(
        id: '3',
        name: 'Dr. Bhaskar Pandey',
        qualification: 'BPT',
        specialization: 'Specialist in Ortho',
        experience: '20 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr Bhaskar Pandey.jpeg',
      ),
      PhysioModel(
        id: '4',
        name: 'Dr. Kapil Sharma',
        qualification: 'BPT, DPR, BBMS',
        specialization: 'Specialist in Ortho & Neuro Care',
        experience: '16 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr Kapil Sharma.jpeg',
      ),
      PhysioModel(
        id: '5',
        name: 'Dr. Rajesh Kumar',
        qualification: 'BPT',
        specialization: 'Specialist in Ortho',
        experience: '21 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr Rajesh Kumar.jpeg',
      ),
      PhysioModel(
        id: '6',
        name: 'Dr.Vishal Upadhyay', // Matching website exactly (no space after Dr.)
        qualification: 'MPT',
        specialization: 'Specialist in Ortho',
        experience: '20 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr Vishal Upadhyay.jpeg',
      ),
      PhysioModel(
        id: '7',
        name: 'Dr. P.K. Yadav',
        qualification: 'DPT, BPT',
        specialization: 'Specialist in Ortho',
        experience: '11 years Experience',
        profilePhoto: 'assets/images/PhysioPics/Dr P.K. Yadav.jpeg',
      ),
    ];
  }

  Future<void> _loadPhysiotherapists() async {
    setState(() {
      _isLoadingPhysios = true;
      _physioError = null;
    });

    // Use manual physiotherapists from code (matching website) instead of API
    // These are the profiles manually created in code to show on website
    print('Loading manual physiotherapists (matching website)...');
    if (mounted) {
      setState(() {
        _physiotherapists = _websitePhysiotherapists;
        _isLoadingPhysios = false;
      });
      // Start auto-slide after loading (with small delay to ensure PageController is ready)
      if (_physiotherapists.isNotEmpty) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            print('Starting physio auto-slide with ${_physiotherapists.length} manual physiotherapists');
            _startPhysioAutoSlide();
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BoneBuddy'),
      ),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Carousel Slider
            _buildCarousel(),
            
            // 2. Our Services Section
            _buildServicesSection(),
            
            // 3. Meet Our Expert Physiotherapists Section
            _buildPhysiotherapistsSection(),
            
            // 4. What Our Patients Say Section
            _buildTestimonialsSection(),
          ],
        ),
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 0),
    );
  }
  
  Widget _buildCarousel() {
    return Column(
      children: [
        LayoutBuilder(
          builder: (context, constraints) {
            // Calculate height based on 16:9 aspect ratio for full-width carousel
            final carouselHeight = (constraints.maxWidth * 9) / 16;
            
            return SizedBox(
              height: carouselHeight,
              child: CarouselSlider(
                options: CarouselOptions(
                  height: carouselHeight,
                  viewportFraction: 1.0,
                  autoPlay: true,
                  autoPlayInterval: const Duration(seconds: 3),
                  onPageChanged: (index, reason) {
                    setState(() => _currentSlide = index);
                  },
                ),
            items: _slides.map((slide) {
              return Builder(
                builder: (BuildContext context) {
                  return Container(
                    width: MediaQuery.of(context).size.width,
                    margin: EdgeInsets.zero,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                    ),
                    child: Image.asset(
                      slide,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorBuilder: (context, error, stackTrace) {
                        print('Error loading image: $slide');
                        print('Error: $error');
                        return Container(
                          width: double.infinity,
                          height: double.infinity,
                          color: Colors.grey[300],
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.image, size: 50),
                                const SizedBox(height: 8),
                                Text(
                                  'Failed to load\n$slide',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  );
                },
              );
            }).toList(),
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _slides.asMap().entries.map((entry) {
            return Container(
              width: 8.0,
              height: 8.0,
              margin: const EdgeInsets.symmetric(horizontal: 4.0),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _currentSlide == entry.key
                    ? const Color(0xFF0066CC)
                    : Colors.grey,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
  
  Widget _buildPhysiotherapistsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32.0, horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(
            child: Text(
              'Meet Our Expert Physiotherapists',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: _isLoadingPhysios
                ? const Center(child: CircularProgressIndicator())
                : _physioError != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _physioError!,
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: _loadPhysiotherapists,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _physiotherapists.isEmpty
                        ? const Center(
                            child: Text(
                              'No physiotherapists available',
                              style: TextStyle(color: Colors.grey),
                            ),
                          )
                        : PageView.builder(
                            controller: _physioPageController,
                            scrollDirection: Axis.horizontal,
                            itemCount: (_physiotherapists.length / 2).ceil(), // Show 2 per page
                            onPageChanged: (index) {
                              setState(() {
                                _currentPhysioIndex = index;
                              });
                            },
                            itemBuilder: (context, pageIndex) {
                              // Calculate which physios to show on this page (2 per page)
                              final startIndex = pageIndex * 2;
                              final endIndex = (startIndex + 2 < _physiotherapists.length) 
                                  ? startIndex + 2 
                                  : _physiotherapists.length;
                              
                              final physiosOnThisPage = endIndex - startIndex;
                              final isLastPage = pageIndex == (_physiotherapists.length / 2).ceil() - 1;
                              final isOddLastPage = isLastPage && physiosOnThisPage == 1;
                              
                              // If last page has only 1 physio (odd), show it centered and full-width
                              if (isOddLastPage) {
                                final physio = _physiotherapists[startIndex];
                                return Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                  child: Center(
                                    child: Container(
                                      width: 200, // Fixed width for single profile on last page
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.grey.withOpacity(0.2),
                                            spreadRadius: 2,
                                            blurRadius: 5,
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        children: [
                                          Expanded(
                                            child: ClipRRect(
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                              child: physio.profilePhoto != null
                                                  ? Image.asset(
                                                      physio.profilePhoto!,
                                                      fit: BoxFit.cover,
                                                      width: double.infinity,
                                                      errorBuilder: (context, error, stackTrace) {
                                                        print('Error loading physio image: ${physio.profilePhoto}');
                                                        return Container(
                                                          color: Colors.grey[300],
                                                          child: const Icon(Icons.person, size: 60),
                                                        );
                                                      },
                                                    )
                                                  : Container(
                                                      color: Colors.grey[300],
                                                      child: const Icon(Icons.person, size: 60),
                                                    ),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.all(12.0),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.center,
                                              children: [
                                                Text(
                                                  physio.name,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 15,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  textAlign: TextAlign.center,
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  physio.displaySpecialty,
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey[600],
                                                  ),
                                                  maxLines: 2,
                                                  overflow: TextOverflow.ellipsis,
                                                  textAlign: TextAlign.center,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }
                              
                              // Normal case: Show 2 physios side by side
                              return Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: List.generate(
                                    physiosOnThisPage,
                                    (index) {
                                      final physio = _physiotherapists[startIndex + index];
                                      return Expanded(
                                        child: Container(
                                          margin: EdgeInsets.only(
                                            right: index == 0 && physiosOnThisPage > 1 ? 8.0 : 0,
                                            left: index == 1 ? 8.0 : 0,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(12),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.grey.withOpacity(0.2),
                                                spreadRadius: 2,
                                                blurRadius: 5,
                                              ),
                                            ],
                                          ),
                                          child: Column(
                                            children: [
                                              Expanded(
                                                child: ClipRRect(
                                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                                  child: physio.profilePhoto != null
                                                      ? Image.asset(
                                                          physio.profilePhoto!,
                                                          fit: BoxFit.cover,
                                                          width: double.infinity,
                                                          errorBuilder: (context, error, stackTrace) {
                                                            print('Error loading physio image: ${physio.profilePhoto}');
                                                            return Container(
                                                              color: Colors.grey[300],
                                                              child: const Icon(Icons.person, size: 40),
                                                            );
                                                          },
                                                        )
                                                      : Container(
                                                          color: Colors.grey[300],
                                                          child: const Icon(Icons.person, size: 40),
                                                        ),
                                                ),
                                              ),
                                              Padding(
                                                padding: const EdgeInsets.all(8.0),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.center,
                                                  children: [
                                                    Text(
                                                      physio.name,
                                                      style: const TextStyle(
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 13,
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                      textAlign: TextAlign.center,
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      physio.displaySpecialty,
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        color: Colors.grey[600],
                                                      ),
                                                      maxLines: 2,
                                                      overflow: TextOverflow.ellipsis,
                                                      textAlign: TextAlign.center,
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
                                ),
                              );
                            },
                          ),
          ),
          const SizedBox(height: 16),
          // Dots indicator for physiotherapists (one dot per page, not per physio)
          if (!_isLoadingPhysios && _physiotherapists.isNotEmpty)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                (_physiotherapists.length / 2).ceil(), // Pages (showing 2 per page)
                (index) => Container(
                  width: _currentPhysioIndex == index ? 24 : 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    color: _currentPhysioIndex == index
                        ? const Color(0xFF0066CC)
                        : Colors.grey[300],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildTestimonialsSection() {
    return Container(
      color: Colors.grey[50],
      padding: const EdgeInsets.symmetric(vertical: 32.0, horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(
            child: Text(
              'What Our Patients Say',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'We value your feedback! Share your experience and help us improve our services.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
          // Auto-sliding testimonial carousel
          SizedBox(
            height: 220,
            child: PageView.builder(
              controller: _testimonialPageController,
              itemCount: _testimonials.length,
              onPageChanged: (index) {
                setState(() {
                  _currentTestimonialIndex = index;
                });
              },
              itemBuilder: (context, index) {
                final testimonial = _testimonials[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: Colors.pink[100],
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.person,
                                  color: Colors.pink[600],
                                  size: 30,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      testimonial['name'] as String,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: List.generate(
                                        testimonial['rating'] as int,
                                        (index) => const Icon(
                                          Icons.star,
                                          color: Colors.amber,
                                          size: 18,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Expanded(
                            child: SingleChildScrollView(
                              child: Text(
                                '"${testimonial['text'] as String}"',
                                style: TextStyle(
                                  color: Colors.grey[700],
                                  fontSize: 14,
                                  fontStyle: FontStyle.italic,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          // Dots indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _testimonials.length,
              (index) => Container(
                width: _currentTestimonialIndex == index ? 24 : 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  color: _currentTestimonialIndex == index
                      ? const Color(0xFF0066CC)
                      : Colors.grey[300],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildServicesSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Our Services',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildServiceCard('Knee Replacement', Icons.accessibility_new),
                _buildServiceCard('Hip Replacement', Icons.healing),
                _buildServiceCard('Spinal Surgery', Icons.medical_services),
                _buildServiceCard('Sports Injury', Icons.sports_soccer),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => context.push('/services'),
              child: const Text('View All Services'),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildServiceCard(String title, IconData icon) {
    return GestureDetector(
      onTap: () => context.push('/services'),
      child: Container(
        width: 120,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.blue[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blue[200]!),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: const Color(0xFF0066CC)),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

