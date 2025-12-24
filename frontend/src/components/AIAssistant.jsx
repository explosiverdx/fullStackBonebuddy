import React, { useState, useRef, useEffect } from 'react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! 👋 I\'m your BoneBuddy AI Assistant. How can I help you today? You can ask me about our services, appointments, physiotherapy, or anything related to BoneBuddy!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Knowledge base for AI responses
  const knowledgeBase = {
    greetings: [
      'Hello! How can I assist you today?',
      'Hi there! Welcome to BoneBuddy. What can I help you with?',
      'Greetings! I\'m here to help with any questions about BoneBuddy services.'
    ],
    services: [
      'BoneBuddy offers comprehensive post-operative physiotherapy services including: Knee Replacement Rehab, Hip Replacement Rehab, Spinal Surgery Rehab, Ankle Surgery Rehab, Shoulder Surgery Rehab, Elbow Surgery Rehab, Wrist Surgery Rehab, Trauma Post-Surgery Rehab, Sports Injury Recovery, and Neurosurgery Rehab. All our services are provided at your doorstep with expert physiotherapists.',
      'We provide home-based physiotherapy services for post-operative recovery. Our expert physiotherapists come to your home with all necessary equipment.',
      'Our services include orthopedic rehabilitation, neuro rehabilitation, sports injury recovery, and post-surgical care with evidence-based protocols.'
    ],
    appointment: [
      'To book an appointment, you can visit our website and fill out the appointment form, or contact us directly via phone or WhatsApp at +91 8881119890.',
      'You can schedule an appointment online through our website, or call us directly. We offer flexible scheduling for your convenience.',
      'Bookings can be made through our appointment page or by contacting our support team via WhatsApp.'
    ],
    physiotherapist: [
      'We have a team of highly qualified and experienced physiotherapists including Chief Physiotherapist Dr. Avneesh Dixit, Senior Physiotherapist Dr. Mazhar, and many other specialists with 15-21 years of experience.',
      'All our physiotherapists are certified and experienced in orthopedic and neuro rehabilitation. They bring all necessary equipment to your home.',
      'Our team includes specialists in Ortho & Neuro care with extensive experience in post-operative rehabilitation.'
    ],
    contact: [
      'You can reach us via WhatsApp at +91 8881119890, or fill out the contact form on our website. We\'re available to assist you!',
      'Contact us through WhatsApp, email, or the contact form. We typically respond within 24 hours.',
      'For immediate assistance, WhatsApp us at +91 8881119890 or use the contact form on our website.'
    ],
    cost: [
      'Our pricing varies based on the type of service and number of sessions required. Please contact us for a personalized quote.',
      'We offer flexible pricing plans. Contact our team for detailed pricing information based on your specific needs.',
      'Pricing depends on your treatment plan. Reach out to us for a customized quote.'
    ],
    location: [
      'BoneBuddy provides doorstep physiotherapy services, so our physiotherapists come to your home! We serve multiple locations.',
      'We offer home-based services, meaning our expert physiotherapists visit you at your location with all necessary equipment.',
      'Our services are delivered at your doorstep across various locations. No need to travel!'
    ],
    insurance: [
      'Yes, we can help you process insurance claims for physiotherapy services. Our team assists with insurance documentation and claims.',
      'We support insurance claim processing for eligible treatments. Contact us for more details about insurance coverage.',
      'Insurance support is available for qualified services. Our team will guide you through the process.'
    ],
    timing: [
      'We offer flexible scheduling to accommodate your needs. Sessions can be scheduled at times convenient for you.',
      'Our services are available with flexible timing. You can discuss preferred timings when booking.',
      'We work around your schedule to provide physiotherapy sessions at your preferred time.'
    ],
    default: [
      'I understand you\'re asking about that. For more specific information, please contact our support team via WhatsApp at +91 8881119890 or use the contact form on our website.',
      'That\'s a great question! For detailed assistance, I recommend reaching out to our team directly through WhatsApp or the contact form.',
      'For personalized assistance with that, please contact our support team who can provide more specific information.'
    ]
  };

  const getResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword matching
    if (lowerMessage.match(/hi|hello|hey|greetings|good morning|good afternoon|good evening/)) {
      return knowledgeBase.greetings[Math.floor(Math.random() * knowledgeBase.greetings.length)];
    }
    
    if (lowerMessage.match(/service|treatment|therapy|rehab|rehabilitation|what do you offer|what services/)) {
      return knowledgeBase.services[Math.floor(Math.random() * knowledgeBase.services.length)];
    }
    
    if (lowerMessage.match(/appointment|book|schedule|when|how to book|booking/)) {
      return knowledgeBase.appointment[Math.floor(Math.random() * knowledgeBase.appointment.length)];
    }
    
    if (lowerMessage.match(/physio|therapist|doctor|who will|expert|qualification|experience/)) {
      return knowledgeBase.physiotherapist[Math.floor(Math.random() * knowledgeBase.physiotherapist.length)];
    }
    
    if (lowerMessage.match(/contact|phone|number|email|reach|get in touch|call|whatsapp/)) {
      return knowledgeBase.contact[Math.floor(Math.random() * knowledgeBase.contact.length)];
    }
    
    if (lowerMessage.match(/price|cost|fee|charge|payment|how much|pricing|affordable/)) {
      return knowledgeBase.cost[Math.floor(Math.random() * knowledgeBase.cost.length)];
    }
    
    if (lowerMessage.match(/location|where|address|city|area|near me|coverage/)) {
      return knowledgeBase.location[Math.floor(Math.random() * knowledgeBase.location.length)];
    }
    
    if (lowerMessage.match(/insurance|claim|cover|coverage|medical insurance/)) {
      return knowledgeBase.insurance[Math.floor(Math.random() * knowledgeBase.insurance.length)];
    }
    
    if (lowerMessage.match(/time|timing|when|schedule|available|hours|open/)) {
      return knowledgeBase.timing[Math.floor(Math.random() * knowledgeBase.timing.length)];
    }

    // If no match, return default response
    return knowledgeBase.default[Math.floor(Math.random() * knowledgeBase.default.length)];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = getResponse(userMessage);
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    let message = '';
    switch(action) {
      case 'services':
        message = 'What services do you offer?';
        break;
      case 'appointment':
        message = 'How can I book an appointment?';
        break;
      case 'contact':
        message = 'How can I contact you?';
        break;
      case 'cost':
        message = 'What are your prices?';
        break;
      default:
        return;
    }
    setInputValue(message);
  };

  const quickActions = [
    { id: 'services', label: 'Our Services', icon: '🩺' },
    { id: 'appointment', label: 'Book Appointment', icon: '📅' },
    { id: 'contact', label: 'Contact Us', icon: '📞' },
    { id: 'cost', label: 'Pricing', icon: '💰' }
  ];

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          title="AI Assistant"
          aria-label="Open AI Assistant"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-32 right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] h-[500px] sm:h-[600px] max-h-[calc(100vh-9rem)] sm:max-h-[calc(100vh-9rem)] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 animate-fadeIn"
             style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">BoneBuddy AI</h3>
                <p className="text-xs text-teal-100">Online • Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-teal-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-gray-600 mb-2 font-medium">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-teal-50 hover:border-teal-300 transition-colors flex items-center gap-1"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-teal-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-lg rounded-bl-none shadow-sm border border-gray-200 p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 Try asking about services, appointments, or contact information
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;

