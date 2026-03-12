# AI-Driven Autonomous Recruitment and Candidate Assessment System

This is a hackathon project in pre-development phase. Below is a detailed description of the problem statement and proposed solution.

## Problem Statement

Corporate HR departments receive a massive volume of applications for every open position. Currently, recruiters are forced to manually parse distinct resume formats to extract information, leading to oversight, unconscious bias, and significant time loss.

Additionally, the logistics of scheduling interviews involve a chaotic loop of "email tag" to find overlapping availability between candidates and busy hiring managers. The initial screening interview is often repetitive and resource-intensive, requiring humans to ask standard questions repeatedly. Finally, post-interview feedback is frequently unstructured or delayed, making the generation of a comprehensive report difficult and slowing down the final hiring decision.

There is a need for a secure, intelligent, and time-efficient digital recruitment system that enables automated data extraction, autonomous calendar management, AI-driven assessments, and instant analytical reporting while ensuring a standardized and unbiased hiring process.

## Short Description

Design and develop a smart recruitment automation application that allows candidates to submit applications where the system instantly parses and ranks information (skills, experience) against the job description using NLP. The system should dynamically identify mutual availability to automate scheduling by syncing with corporate calendars.

The solution must replace manual screening with an intelligent, interactive interview bot capable of conducting technical and behavioral assessments via voice/video with proctoring capabilities. The process should conclude by automatically converting transcript data into a detailed, data-driven report and scorecard, enabling faster, objective, and seamless decision-making for hiring managers.

## 🤖 Adaptive Interview Bot

### Overview

The **Adaptive Interview Bot** is the core AI interviewer that conducts professional, context-aware candidate interviews. It dynamically adjusts questions based on candidate responses, handles edge cases gracefully, and maintains a natural conversation flow.

### Key Features

#### 1. **Adaptive Questioning**
- Generates follow-up questions for short responses
- Moves to next topic for detailed responses
- References specific details from previous answers
- Maintains natural conversation flow

#### 2. **Interview Flow Management**
```
Greeting → Introduction → Experience → Skills → Scenarios → Q&A → Closing
```
Dynamically adapts based on candidate responses and time constraints.

#### 3. **Refusal Handling**
Gracefully handles when candidates want to stop:
- Detects phrases like "I don't want to continue", "not interested", "stop interview"
- Responds professionally: *"Thank you for your time. I completely understand..."*
- Ends interview gracefully

#### 4. **Human-in-the-Loop (HITL)**
Escalates to human recruiters when needed:
- Candidate requests human assistance
- Technical issues reported
- Complaints raised
- Questions outside bot's scope

#### 5. **Context Awareness**
- Remembers all previous answers
- References earlier topics naturally
- Builds on established information
- Creates coherent conversation

#### 6. **Professional Tone**
- Sounds like a real recruiter, not a bot
- Polite and concise
- No robotic phrases or excessive enthusiasm
- Direct and natural communication

#### 7. **Safety & Compliance**
- Never asks discriminatory questions (age, race, religion, etc.)
- Only job-relevant questions
- Follows legal hiring practices

### Quick Start

```python
from ai_interview_bot.services.adaptive_interview_bot import adaptive_bot

# Generate greeting
greeting = adaptive_bot.generate_greeting("Software Engineer", "TechCorp")

# Process candidate response
result = adaptive_bot.generate_next_question(
    session=session,
    candidate_response="I have 5 years of Python experience...",
    position="Software Engineer",
    company="TechCorp"
)

# Handle different actions
if result["action"] == "end_interview":
    # Candidate declined
elif result["action"] == "escalate_to_human":
    # Connect to human recruiter
else:
    # Continue interview with next question
```

### Documentation

- **Full Guide**: [backend/ADAPTIVE_BOT_GUIDE.md](backend/ADAPTIVE_BOT_GUIDE.md)
- **Quick Reference**: [backend/QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md)
- **Test Suite**: Run `python backend/test_adaptive_bot.py`

### Example Conversations

**Adaptive Questioning:**
```
Bot: "Tell me about your Python experience."
Candidate: "I have 2 years."
Bot: "Could you describe the types of Python projects you've worked on?"
```

**Context Awareness:**
```
[Earlier] Candidate: "I built a real-time chat app."
[Later] Bot: "You mentioned the chat app earlier. What were the main scalability challenges?"
```

**Refusal Handling:**
```
Candidate: "I don't want to continue the interview."
Bot: "Thank you for your time. I completely understand. If you would like to continue in the future, feel free to reconnect. Have a great day."
[Interview ends gracefully]
```

### Architecture

```
Frontend (React/TypeScript)
    ↓ WebSocket
Backend (FastAPI/Python)
    ↓
Adaptive Interview Bot
    ↓
OpenAI GPT-4o-mini + Sarvam TTS
```

### Testing

Comprehensive test suite covering:
- ✅ Greeting generation
- ✅ Adaptive questioning (short vs detailed responses)
- ✅ Refusal handling
- ✅ HITL escalation
- ✅ Context awareness
- ✅ Stage progression

```bash
cd backend
python test_adaptive_bot.py
```

### Configuration

Set environment variables:
```env
OPENAI_API_KEY=your_openai_api_key
SARVAM_API_KEY=your_sarvam_api_key
```

---

## Project Structure

```
CodeBits/
├── backend/
│   ├── ai_interview_bot/
│   │   ├── services/
│   │   │   ├── adaptive_interview_bot.py  # 🆕 Core adaptive bot
│   │   │   ├── interview_session.py
│   │   │   ├── code_executor.py
│   │   │   └── sarvam_service.py
│   │   ├── router.py                      # WebSocket handler
│   │   └── service.py
│   ├── authentication/
│   ├── test_adaptive_bot.py               # 🆕 Test suite
│   ├── ADAPTIVE_BOT_GUIDE.md              # 🆕 Full documentation
│   ├── QUICK_REFERENCE.md                 # 🆕 Quick reference
│   └── main.py
└── frontend/
    ├── components/
    │   └── interview/
    │       ├── DynamicInterviewLayout.tsx
    │       ├── ConversationPanel.tsx
    │       └── CandidateProctoringPanel.tsx
    └── hooks/
```
