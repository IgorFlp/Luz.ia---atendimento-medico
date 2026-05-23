import { AppointmentService } from '../../services/appointmentService.ts';
import type { GraphState } from '../graph.ts';
import { date, z } from 'zod/v3';

// Validação secundaria para garantir resposta correta.
const SchedulerRequiredFieldsSchema = z.object({
  professionalId: z.number({required_error: 'Professional ID is required for scheduling'}),
  datetime: z.string({required_error: 'Datetime is required for scheduling'}),
  patientName: z.string({required_error: 'Patient name is required for scheduling'}),
});

export function createSchedulerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`📅 Scheduling appointment...`);

    try {
      const validation = SchedulerRequiredFieldsSchema.safeParse(state);
      if(!validation.success){
        console.error('❌ Scheduling validation failed:', validation.error.format());
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        return {       
          actionSuccess: false,
          actionError: `${errorMessages}`,
        }
      }
      const appointment = await appointmentService.bookAppointment(
        validation.data.professionalId,
        new Date(validation.data.datetime),
        validation.data.patientName,
        state.reason ?? "Not specified",
      );

      console.log(`✅ Appointment scheduled successfully`);

      return {
        ...state,
        actionSuccess: true,
        appointmentData: appointment,
      };
    } catch (error) {
      console.log(`❌ Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        ...state,
        actionSuccess: false,
        actionError: error instanceof Error ? error.message : 'Scheduling failed',
      };
    }
  };
}
