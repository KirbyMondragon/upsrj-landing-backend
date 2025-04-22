import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

// Decorador personalizado para obtener el usuario de la solicitud
export const GetUser = createParamDecorator(
    (data:string, ctx:ExecutionContext)=> {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if(!user){
            throw new UnauthorizedException("User not found (request)");
        }
        return (!data) 
        ? user
        : user[data];

    }
);