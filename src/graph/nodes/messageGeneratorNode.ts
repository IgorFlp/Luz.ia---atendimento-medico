import type { GraphState } from '../graph.ts';
import { AIMessage } from 'langchain';
import { OpenRouterService } from '../../services/openRouterService.ts';
import { getSystemPrompt, getUserPromptTemplate, MessageSchema } from '../../prompts/v1/messageGenerator.ts';


export function createMessageGeneratorNode(llmClient: OpenRouterService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log(`💬 Generating response message...`);

        try {
            const hasSuccess = state.actionSuccess? "success" : "error";
            const scenario = `${state.intent ?? 'unknown'}_${hasSuccess}`;
            const details = {                
                professionalName: state.professionalName,
                patientName: state.patientName,
                datetime: state.datetime,                
                error: state.actionError || state.error,
            }
            const systemPrompt = getSystemPrompt();
            const userPrompt = getUserPromptTemplate({ scenario, details });

            const result = await llmClient.generateStructured(
                systemPrompt,
                userPrompt,
                MessageSchema,
            );
            console.log('✅ Message generated:', result);
            
            if (!result.success) {
                console.error('❌ Failed to generate message:', result.error);
                const errorMessage = 'Desculpe, ocorreu um erro ao gerar a mensagem. Por favor, tente novamente.';
                return {                   
                    messages: [
                        ...state.messages,
                        new AIMessage(errorMessage)
                    ],
                };
            }
            return {               
                messages: [
                    ...state.messages,
                    new AIMessage(result.data!.message)
                ],
            };
        } catch (error) {
            console.error('❌ Error in messageGenerator node:', error);
            return {
                ...state,
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred while processing your request.')
                ],
            };
        }
    };
}
