import '../models/service_content_model.dart';
import '../utils/helpers.dart';

class ServiceContentData {
  static ServiceContentModel? getServiceContent(String serviceId) {
    return _serviceContents[serviceId];
  }
  
  static final Map<String, ServiceContentModel> _serviceContents = {
    'knee-replacement-rehab': ServiceContentModel(
      id: 'knee-replacement-rehab',
      title: 'Knee Replacement Recovery',
      image: '/assets/Services/Services (6).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A new knee should mean a new life — less pain, more mobility, and the freedom to walk, climb stairs and return to daily activities. But the road from the operating table to independent movement is a journey. Post knee replacement physiotherapy is the bridge that changes surgical success into real, everyday recovery. At BoneBuddy, we combine evidence-based therapy, doctor supervision and digital tracking to make your recovery from knee replacement surgery faster, safer and measurable.',
        ),
        ServiceSection(
          title: 'Why Knee Replacement Recovery Matters',
          content: 'Undergoing a knee replacement surgery — whether a total knee replacement or complete knee replacement — is a major step. The operation fixes the joint, but the body still needs guided rehabilitation to recover range of motion, rebuild muscle strength and prevent complications like stiffness or gait abnormalities. Without structured physiotherapy, patients often face slow improvement, reduced function and frustration.\n\nBoneBuddy\'s approach ensures you don\'t have to choose between convenience and quality. Our structured, surgeon-supervised plans are tailored to your recovery timeline and delivered at home — perfect for elderly patients who find travelling difficult, working professionals who need flexible timings, and anyone wanting insurance-supported, trackable care.',
        ),
        ServiceSection(
          title: 'Who Should Choose BoneBuddy for Knee Replacement Recovery?',
          content: 'Primary Audience:',
          bulletPoints: [
            'Patients recovering from knee replacement surgery',
            'Elderly people for whom hospital visits are difficult',
            'Working professionals preferring home-based physiotherapy',
            'Patients seeking insurance-backed recovery with digital progress tracking',
          ],
          subtitle: 'Secondary Audience:',
        ),
        ServiceSection(
          title: 'Secondary Audience',
          bulletPoints: [
            'Orthopaedic surgeons and rehabilitation doctors',
            'Physiatrists and clinic managers looking for a tech-enabled partner',
            'Families and caregivers making decisions for elderly patients',
          ],
        ),
        ServiceSection(
          title: '25-Session Post-Surgery Physiotherapy Plan (Knee Replacement)',
          content: 'Our 25-session knee replacement recovery plan is structured to follow the natural healing timeline. Each phase focuses on specific goals — pain control, range of motion, strength building, proprioception and finally, functional independence. All sessions are delivered by trained physiotherapists and reviewed by doctors as needed.',
        ),
        ServiceSection(
          title: 'Phase 1: Acute Phase (Session 1-5)',
          content: 'Goals: Pain relief, swelling reduction, prevention of Deep Vein Thrombosis (DVT).',
          bulletPoints: [
            'Cryotherapy and elevation to reduce swelling',
            'Ankle pumps and circulation exercises to prevent DVT',
            'Quadriceps isometrics to activate key muscles without stressing the joint',
            'Passive range of motion (ROM) to maintain mobility',
            'Initial gait training with walker or assistive device',
          ],
        ),
        ServiceSection(
          title: 'Phase 2: Early Recovery (Session 6-10)',
          content: 'Goals: Improve ROM, begin active muscle activation and safe weight-bearing.',
          bulletPoints: [
            'Heel slides and active-assisted ROM to restore knee bending',
            'Straight leg raises to retrain quadriceps',
            'Closed kinetic chain exercises for safe loading',
            'Progressive gait re-education — moving from walker to stick as appropriate',
          ],
        ),
        ServiceSection(
          title: 'Phase 3: Strengthening (Session 11-15)',
          content: 'Goals: Build muscle strength, improve joint stability and endurance.',
          bulletPoints: [
            'Resistance band training for quads, hamstrings and hip abductors',
            'Hip abductor strengthening to stabilise the pelvis and gait',
            'Balance drills and stationary cycling to build endurance',
          ],
        ),
        ServiceSection(
          title: 'Phase 4: Advanced Training (Session 16-20)',
          content: 'Goals: Proprioception, dynamic stability and safe functional movement.',
          bulletPoints: [
            'PNF techniques and wobble board training for balance',
            'Stair climbing drills with emphasis on safe mechanics',
            'Treadmill walking with gait correction and cadence training',
          ],
        ),
        ServiceSection(
          title: 'Phase 5: Functional Recovery (Session 21-25)',
          content: 'Goals: Return to daily life, independence, and occupation-specific tasks.',
          bulletPoints: [
            'Functional strengthening — sit-stand training, squats adapted to ability',
            'Endurance training and longer walking sessions',
            'Stair negotiation and community mobility practice',
            'Comprehensive Home Exercise Program (HEP) to maintain gains long-term',
          ],
        ),
        ServiceSection(
          title: '',
          content: 'BoneBuddy provides this structured 25-session recovery plan with an additional 1 month of online physiotherapy support if needed. All therapy progress is monitored digitally and can be shared with your surgeon or insurance provider to support claims and clinical decisions.',
        ),
        ServiceSection(
          title: 'Clinical Oversight & Digital Tracking',
          content: 'The difference between local physiotherapy and BoneBuddy is continuity and visibility. Our platform ensures:',
          bulletPoints: [
            'Doctor-reviewed protocols tailored to total knee replacement surgery or full knee replacement.',
            'Daily logs for pain, ROM and mobility that you and your clinician can review.',
            'Video-guided exercises and remote adjustments — ideal for patients who cannot visit the clinic frequently.',
          ],
          subtitle: 'This model is especially beneficial for patients searching for the best knee replacement surgeons near me and wanting a consistent, measurable rehabilitation pathway after the operation.',
        ),
        ServiceSection(
          title: 'Benefits of Choosing BoneBuddy for Knee Replacement Recovery',
          bulletPoints: [
            'Structured, evidence-based plan: Follows a safe progression from pain control to high-level function.',
            'Home-based convenience: Reduces travel and exposure, ideal for elderly and busy professionals.',
            'Surgeon-friendly reporting: Shareable progress reports for post-op follow-ups and insurance.',
            'Personalised care: Exercises and milestones adapted to surgery type and patient goals.',
            'Extended support: 1-month online follow-up available after the 25 sessions.',
          ],
        ),
        ServiceSection(
          title: 'Common Questions about Recovery Time for Knee Replacement',
          content: 'Every patient\'s recovery timeline is different, but typical milestones include: walking with aids in days, independent walking in weeks, and return to low-impact activities within 8-12 weeks for many patients. Full recovery and high-demand activities may take 6-12 months depending on age, preoperative fitness and surgical factors.\n\nOur knee replacement recovery timeline within the 25-session plan focuses on early safe gains and gradual progression so you build lasting strength and confidence. We coordinate closely with surgeons to adjust therapy if needed.',
        ),
        ServiceSection(
          title: 'Ready to Start Recovery?',
          content: 'Do not let uncertainty slow your recovery. Book Your Knee Rehab Plan today and start your journey towards pain-free movement. Our team will assess your surgical details, build a personalised rehabilitation path, and connect you with the right physiotherapist — all monitored by doctors and tracked digitally for clear progress.',
        ),
      ],
    ),
    
    'hip-replacement-rehab': ServiceContentModel(
      id: 'hip-replacement-rehab',
      title: 'Hip Replacement Recovery',
      image: '/assets/Services/Hip Replacement.jpg',
      sections: [
        ServiceSection(
          title: '',
          content: 'Hip Replacement Recovery is a journey — from the first careful step after surgery to the day you walk, climb stairs, and return to your everyday life without fear. At BoneBuddy we guide you through this journey with a structured, evidence-based plan that combines hands-on physiotherapy, home-based exercises and powerful digital tracking so both patients and doctors stay informed at every step.',
        ),
        ServiceSection(
          title: 'Why Hip Surgery Rehabilitation Matters',
          content: 'Undergoing a hip replacement or a hip operation is the start of a life-changing recovery. Without the right rehabilitation, patients can face stiffness, muscle weakness and prolonged pain. Our hip surgery rehabilitation programme focuses on early mobilization, progressive strengthening and balance retraining to restore function, reduce complications like DVT, and make your new hip last longer.',
        ),
        ServiceSection(
          title: 'Who this program is for',
          content: 'BoneBuddy\'s hip replacement physiotherapy is designed for:',
          bulletPoints: [
            'Post-surgery patients (hip replacement, hip fracture treatment, revision surgeries)',
            'Working professionals who need home-based physiotherapy',
            'Patients who want digital tracking, doctor supervision and insurance-ready documentation',
            'Orthopedic and rehabilitation teams looking to recommend a reliable recovery partner',
          ],
        ),
        ServiceSection(
          title: 'BoneBuddy\'s 25-Session Physiotherapy Plan (After Hip Replacement)',
          content: 'To make recovery systematic and measurable, we follow a 25-session physiotherapy plan. Each phase targets specific goals so progress is visible and meaningful.',
        ),
        ServiceSection(
          title: 'Phase 1: Acute Phase (Sessions 1–5)',
          content: 'Goals: Control pain & swelling, prevent DVT, initiate safe mobility.',
          bulletPoints: [
            'Cryotherapy (cold packs) for pain and edema control',
            'Ankle pumps and quadriceps isometrics to maintain circulation',
            'Log rolling and safe bed mobility techniques',
            'Gait training with walker/crutches (weight bearing per surgeon\'s advice)',
            'Education on hip precautions: avoid >90° flexion, no leg crossing, avoid internal rotation',
          ],
        ),
        ServiceSection(
          title: 'Phase 2: Early Recovery (Sessions 6–10)',
          content: 'Goals: Improve range of motion (ROM), activate hip muscles, begin functional training.',
          bulletPoints: [
            'Active-assisted and active ROM within precautions (flexion, abduction, extension)',
            'Heel slides, straight leg raises (SLR) to restore mobility',
            'Closed kinetic chain (CKC) exercises — mini squats, step-ups',
            'Gait re-education and balance drills in supported standing',
          ],
        ),
        ServiceSection(
          title: 'Phase 3: Strengthening Phase (Sessions 11–15)',
          content: 'Goals: Increase muscle strength, hip stability and endurance.',
          bulletPoints: [
            'Hip abductor and extensor strengthening',
            'Resistance training with Thera-Band and light weights',
            'Sit-to-stand drills and low-resistance stationary cycling',
            'Core stabilization exercises to support posture and gait',
          ],
        ),
        ServiceSection(
          title: 'Phase 4: Advanced Training (Sessions 16–20)',
          content: 'Goals: Enhance balance, proprioception and functional mobility.',
          bulletPoints: [
            'PNF techniques and proprioceptive training',
            'Balance board and foam pad exercises',
            'Stair climbing and descent training',
            'Advanced gait correction aiming for independent walking without limp',
          ],
        ),
        ServiceSection(
          title: 'Phase 5: Functional Recovery (Sessions 21–25)',
          content: 'Goals: Regain independence in ADLs and return to normal lifestyle.',
          bulletPoints: [
            'Advanced strengthening with bands and light weights',
            'Endurance training — long walks, treadmill and cycling',
            'Functional drills — sit-to-stand, stair negotiation and simulated activities',
            'Home Exercise Program (HEP) for long-term recovery and maintenance',
          ],
        ),
        ServiceSection(
          title: 'Digital Recovery Tracking & Doctor Supervision',
          content: 'BoneBuddy brings physiotherapy into the digital age. Our app creates a clear link between patient, physiotherapist and surgeon so nobody works in isolation. Key benefits:',
          bulletPoints: [
            'Doctor monitoring and remote review of progress',
            'Daily exercise logs and pain-trend tracking',
            'Personalised video exercises uploaded by your physiotherapist',
            'Insurance-ready digital reports to simplify claims',
          ],
        ),
        ServiceSection(
          title: 'Why Patients and Doctors Trust BoneBuddy',
          bulletPoints: [
            'Protocol-based sessions created with rehabilitation specialists',
            'Individualized plans adapted to your surgery type and lifestyle',
            'Convenience of home visits plus the assurance of remote doctor oversight',
            'Measurable outcomes tracked in-app so progress is transparent',
          ],
        ),
        ServiceSection(
          title: 'Ready to begin your recovery?',
          content: 'Don\'t let pain or uncertainty slow you down. Book Your Hip Rehab Plan and take the first step to reclaiming your independence.',
        ),
      ],
    ),
    
    'spinal-surgery-rehab': ServiceContentModel(
      id: 'spinal-surgery-rehab',
      title: 'Spinal Surgery Rehab',
      image: '/assets/Services/Spinal Surgery.jpg',
      sections: [
        ServiceSection(
          title: '',
          content: 'Spinal surgery requires careful, supervised rehabilitation to ensure proper healing and prevent complications. Our surgeon-supervised program focuses on pain management, core stabilization, and safe functional movement after spinal surgery.',
        ),
        ServiceSection(
          title: 'Why Spinal Surgery Rehabilitation is Critical',
          content: 'Spinal surgery addresses structural issues, but recovery depends on proper rehabilitation to restore function, manage pain, and prevent re-injury. Our program is designed with surgeon input to ensure safe progression.',
        ),
        ServiceSection(
          title: 'Key Components of Our Spinal Rehab Program',
          bulletPoints: [
            'Pain management techniques and modalities',
            'Core strengthening and stabilization',
            'Gradual return to functional movements',
            'Posture correction and body mechanics training',
            'Safe lifting and movement techniques',
          ],
        ),
      ],
    ),
    
    'ankle-surgery-rehab': ServiceContentModel(
      id: 'ankle-surgery-rehab',
      title: 'Ankle Surgery Rehab',
      image: '/assets/Services/Services (2).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A 25-session plan to control pain and swelling, restore mobility and strength, and enhance stability for a safe return to daily life and sports.',
        ),
        ServiceSection(
          title: 'Recovery Phases',
          content: 'Our structured program progresses through phases focusing on pain control, mobility restoration, strength building, and functional return to activities.',
        ),
      ],
    ),
    
    'elbow-surgery-rehab': ServiceContentModel(
      id: 'elbow-surgery-rehab',
      title: 'Elbow Surgery Rehab',
      image: '/assets/Services/Services (11).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'This plan focuses on controlling pain, initiating safe mobilization, and progressing to advanced strengthening to regain full function for occupational or sports activities.',
        ),
      ],
    ),
    
    'wrist-surgery-rehab': ServiceContentModel(
      id: 'wrist-surgery-rehab',
      title: 'Wrist Surgery Rehab',
      image: '/assets/Services/Services (5).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A structured program to manage pain, restore mobility, and improve grip strength and dexterity for a full return to daily tasks and work.',
        ),
      ],
    ),
    
    'shoulder-surgery-rehab': ServiceContentModel(
      id: 'shoulder-surgery-rehab',
      title: 'Shoulder Surgery Rehab',
      image: '/assets/Services/Services (12).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A phased approach to restore mobility and stability, progressing from pain control to advanced strengthening and a full return to daily activities.',
        ),
      ],
    ),
    
    'trauma-post-surgery': ServiceContentModel(
      id: 'trauma-post-surgery',
      title: 'Trauma Post-Surgery',
      image: '/assets/Services/Services (9).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A phase-wise recovery plan for fractures and polytrauma, tailored to progress from acute pain management to functional training under surgeon clearance.',
        ),
      ],
    ),
    
    'sports-injury-recovery': ServiceContentModel(
      id: 'sports-injury-recovery',
      title: 'Sports Injury Recovery',
      image: '/assets/Services/Services (10).jpeg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A dedicated plan to help athletes return to play safely, progressing from pain control to sport-specific drills and injury prevention strategies.',
        ),
      ],
    ),
    
    'neurosurgery-rehab': ServiceContentModel(
      id: 'neurosurgery-rehab',
      title: 'Neurosurgery Rehab',
      image: '/assets/Services/Neurosurgery.jpg',
      sections: [
        ServiceSection(
          title: '',
          content: 'A part-wise recovery program focused on pain control, safe mobilization, and restoring functional independence under surgeon-approved protocols.',
        ),
      ],
    ),
  };
}

