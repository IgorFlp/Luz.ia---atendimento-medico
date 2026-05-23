import { AppointmentService } from '../../services/appointmentService.ts';
import type { GraphState } from '../graph.ts';
import z from 'zod/v3';

const CancellerRequiredFieldsSchema = z.object({
  professionalId: z.number(),
  datetime: z.string(),  
})

export function createCancellerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`❌ Cancelling appointment...`);

    try {
      const validation = CancellerRequiredFieldsSchema.safeParse(state);
      if (!validation.success) {
        console.error('❌ Cancellation failed: Missing required fields', validation.error.errors);
        const errorMessage = `Missing required fields for cancellation: ${validation.error.errors.map(e => e.path).join(', ')}`;
        return{
          actionSuccess: false,
          actionError: errorMessage,
        }
       }        
      
      const cancellation = await appointmentService.cancelAppointment(
        validation.data.professionalId,
        new Date(validation.data.datetime),
        state.patientName ?? "Unknown patient",
      );

      return {        
        actionSuccess: true,
        appointmentData: cancellation,
      };
    } catch (error) {
      console.log(`❌ Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        ...state,
        actionSuccess: false,
        actionError: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  };
}
