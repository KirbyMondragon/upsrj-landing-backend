import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

/**
 * Entity representing a Puck component in the database
 * Puck components are building blocks for the landing page editor
 */
@Entity('puck_components')
export class PuckComponent {
    /**
     * Unique identifier for the component
     */
    @ObjectIdColumn()
    id: ObjectId;

    /**
     * Name of the component
     * Used for identification and categorization of components
     */
    @Column()
    slug: string;

    /**
     * Main content of the Puck component
     * Contains type, props and optional readOnly settings
     */
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

    /**
     * Root configuration for the Puck component
     * Contains props and optional readOnly settings
     */
    @Column('simple-json')
    root: {
        props: {
            title: string;
        };
        readOnly?: {
            title?: boolean;
        };
    };

    /**
     * Zones configuration for the component
     * Maps zone names to arrays of component configurations
     */
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
