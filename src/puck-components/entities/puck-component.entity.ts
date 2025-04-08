import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('puck_components')
export class PuckComponent {
    @ObjectIdColumn()
    id: ObjectId;

    @Column('simple-json')
    content: { //Puede ser un array de objetos o un objeto
        type: string;
        props: {
            id: string;
            title: string;
            description: string; //Se pueden añadir más propiedades según sea necesario
        };
        readOnly?: {
            title?: boolean;
            description?: boolean;
        };
    };

    @Column('simple-json')
    root: {
        props: {
            title: string;
        };
        readOnly?: {
            title?: boolean;
        };
    };

    @Column('simple-json')
    zones: Record<string, Array<{
        type: string;
        props: {
            id: string;
            title: string;
        };
        readOnly?: {
            title?: boolean;
        };
    }>>;
}
