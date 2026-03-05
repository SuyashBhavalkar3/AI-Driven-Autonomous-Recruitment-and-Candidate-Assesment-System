import ai_interview_bot.router
import ai_interview_bot.service
import ai_interview_bot.services.sarvam_service

print('imports ok')
print('transcribe empty ->', ai_interview_bot.services.sarvam_service.transcribe_audio(b''))
print('speech len ->', len(ai_interview_bot.services.sarvam_service.generate_speech('hi')))
print('eval ->', ai_interview_bot.service.evaluate_response({'transcript': []}))
