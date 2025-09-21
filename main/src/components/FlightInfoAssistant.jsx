import { useState } from 'react';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

const FlightInfoAssistant = ({ isOpen, onToggle, flightStrips = [], columns = [], onMoveStrip, onUpdateStripNotes, onUpdateStripSquawk }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const getCurrentStripsData = () => {
    if (!flightStrips.length || !columns.length) return 'No flight strips currently loaded.';
    
    const stripsByColumn = columns.map(column => {
      const stripsInColumn = flightStrips.filter(strip => strip.column === column.id);
      const stripInfo = stripsInColumn.map(strip => 
        `${strip.callsign} (${strip.aircraft}) - ${strip.route} - ${strip.altitude}`
      ).join(', ');
      
      return `${column.name}: ${stripsInColumn.length} strips${stripsInColumn.length > 0 ? ` - ${stripInfo}` : ''}`;
    }).join('\n');
    
    return stripsByColumn;
  };



  const executeAICommands = (aiResponse) => {
    console.log('AI Response:', aiResponse);
    
    // Parse AI response for function calls
    const lines = aiResponse.split('\n');
    let actions = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      console.log('Checking line:', trimmedLine);
      
      // Look for moveStrip commands
      const moveMatch = trimmedLine.match(/moveStrip\(([^,]+),\s*([^)]+)\)/i);
      if (moveMatch) {
        console.log('Found moveStrip command:', moveMatch);
        const callsign = moveMatch[1].trim().replace(/['"]/g, '');
        const targetColumn = moveMatch[2].trim().replace(/['"]/g, '');
        
        const strip = flightStrips.find(s => s.callsign.toUpperCase() === callsign.toUpperCase());
        console.log('Found strip:', strip, 'Target column:', targetColumn);
        
        if (strip && onMoveStrip) {
          const dragEndEvent = {
            active: { id: strip.id },
            over: { id: targetColumn }
          };
          onMoveStrip(dragEndEvent);
          actions.push(`Moved ${callsign} to ${targetColumn}`);
          console.log('Executed moveStrip for', callsign, 'to', targetColumn);
        } else {
          console.log('Could not execute moveStrip - strip:', !!strip, 'onMoveStrip:', !!onMoveStrip);
        }
      }
      
      // Look for updateStripNotes commands
      const notesMatch = trimmedLine.match(/updateStripNotes\(([^,]+),\s*([^)]+)\)/i);
      if (notesMatch) {
        console.log('Found updateStripNotes command:', notesMatch);
        const callsign = notesMatch[1].trim().replace(/['"]/g, '');
        const note = notesMatch[2].trim().replace(/['"]/g, '');
        
        if (onUpdateStripNotes) {
          onUpdateStripNotes(callsign, note);
          actions.push(`Added note to ${callsign}: ${note}`);
          console.log('Executed updateStripNotes for', callsign, ':', note);
        }
      }
      
      // Look for updateStripSquawk commands
      const squawkMatch = trimmedLine.match(/updateStripSquawk\(([^,]+),\s*([^)]+)\)/i);
      if (squawkMatch) {
        console.log('Found updateStripSquawk command:', squawkMatch);
        const callsign = squawkMatch[1].trim().replace(/['"]/g, '');
        const squawkCode = squawkMatch[2].trim().replace(/['"]/g, '');
        
        if (onUpdateStripSquawk) {
          onUpdateStripSquawk(callsign, squawkCode);
          actions.push(`Updated squawk for ${callsign} to ${squawkCode}`);
          console.log('Executed updateStripSquawk for', callsign, ':', squawkCode);
        }
      }
    }
    
    console.log('Actions taken:', actions);
    return actions;
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await callCerebrasAPI(question);
      
      // Execute any commands the AI suggested
      const actions = executeAICommands(response);
      
      // If actions were taken, only show the actions list
      if (actions.length > 0) {
        setResponse('Actions taken:\n' + actions.join('\n'));
      } else {
        // If no actions were taken, show the full AI response
        setResponse(response);
      }
    } catch (error) {
      console.error('Cerebras API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const callCerebrasAPI = async (question) => {
    const API_KEY = 'csk-3xheccw68c43n5ejftvefcf3hy39ryddrrrv69y2wmxnexf2';
    
    // Add context about flight information organization to help the AI provide relevant answers
    const currentStripsData = getCurrentStripsData();
    const contextPrompt = `You are an expert Air Traffic Control (ATC) assistant specializing in flight information organization and management. 

Context: This is a digital flight progress strips system with the following workflow:
- Clearance Delivery: Issues IFR clearances, route assignments, and departure clearances
- Ground Control: Manages aircraft movement on the ground, taxi instructions, runway crossings
- Local Control: Manages aircraft in airport vicinity, takeoffs, landings, traffic patterns
- Flight Data Coordinator: Manages flight plan data, coordinates with other facilities
- TRACON Handoff: Handles aircraft in terminal area, approach/departure procedures

Current Flight Strips Status:
${currentStripsData}

CRITICAL: You are an ATC assistant that MUST execute actions on flight strips. When you receive ATC commands, you MUST call the appropriate functions.

ATC COMMAND PROCESSING RULES:
1. If the input contains a callsign (like AAL123, UAL456, BAW789) followed by a command, it's an ATC relay
2. You MUST call the appropriate functions to move strips and update data
3. Do NOT just provide information - EXECUTE ACTIONS

FUNCTION CALL FORMAT:
- moveStrip(callsign, targetColumn)
- updateStripNotes(callsign, note)
- updateStripSquawk(callsign, squawkCode)

EXAMPLES OF REQUIRED ACTIONS:
Input: "AAL123, contact departure frequency 121.4"
Response: moveStrip(AAL123, tracon)
updateStripNotes(AAL123, Contact departure 121.4)

Input: "UAL456, clear to taxi via taxiway A"
Response: moveStrip(UAL456, ground)
updateStripNotes(UAL456, Taxiway A)

Input: "BAW789, squawk 4567"
Response: updateStripSquawk(BAW789, 4567)
updateStripNotes(BAW789, Squawk 4567)

COLUMN MAPPINGS:
- "clearance" = Clearance Delivery
- "ground" = Ground Control
- "tower" = Local Control
- "departure" = Flight Data Coordinator
- "tracon" = TRACON Handoff

User Question: ${question}

MANDATORY: If this contains a callsign and ATC command, you MUST call the appropriate functions. Do not just provide information - execute the actions!`;

    console.log('Making Cerebras API call with question:', question);
    console.log('API Key present:', !!API_KEY);
    console.log('API Key length:', API_KEY ? API_KEY.length : 0);

     try {
       const client = new Cerebras({
         apiKey: API_KEY,
       });

       const chatCompletion = await client.chat.completions.create({
         messages: [
           {
             role: 'user',
             content: contextPrompt
           }
         ],
         model: 'llama-4-scout-17b-16e-instruct',
         max_tokens: 1000,
         temperature: 0.7,
         stream: false
       });

       console.log('Cerebras API Response:', chatCompletion);
       
       if (chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
         const content = chatCompletion.choices[0].message.content;
         console.log('AI Response content:', content);
         return content;
       } else {
         console.error('Unexpected API response format:', chatCompletion);
         throw new Error('Unexpected API response format');
       }
     } catch (error) {
       console.error('Cerebras API Error:', error);
       throw error;
     }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech recognition result:', transcript);
      setQuestion(transcript);
      setIsRecording(false);
      
      // Auto-send the transcribed text
      setTimeout(() => {
        handleAskQuestion();
      }, 100);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      alert(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
    };

    return recognition;
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      if (recognition) {
        recognition.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const newRecognition = initializeSpeechRecognition();
      if (newRecognition) {
        setRecognition(newRecognition);
        newRecognition.start();
      }
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-gray-900 border-l border-gray-700 transform transition-transform duration-300 ease-in-out z-40 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ width: '400px' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Flight Info Assistant</h3>
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">Ask questions about flight information organization</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Response Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {response ? (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">{response}</div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm">Ask me about flight strip organization, control positions, or ATC workflows</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={handleVoiceRecord}
              disabled={loading}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isRecording ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
            <div className="flex-1 relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about flight information organization or give ATC commands..."
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                disabled={loading}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Quick Questions */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Strip organization',
                'Control positions',
                'Workflow process',
                'Clearance delivery'
              ].map((quickQuestion) => (
                <button
                  key={quickQuestion}
                  onClick={() => setQuestion(quickQuestion)}
                  className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                >
                  {quickQuestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightInfoAssistant;
