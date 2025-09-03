import { Application } from 'express';
declare class App {
    app: Application;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    private initializeDatabase;
    listen(port: number): void;
}
export default App;
//# sourceMappingURL=app.d.ts.map