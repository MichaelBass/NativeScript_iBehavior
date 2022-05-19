import { Schedule } from './schedule';

export class UserModel {
    record_id: string;
    name: string;
    uuid: string;
    active: boolean;
    schedule: Schedule[];
}