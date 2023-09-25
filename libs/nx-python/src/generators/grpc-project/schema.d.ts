export interface GRPCProjectGeneratorSchema {
  /**
   * Name of the project.
   */
  name: string;
  /**
   * Description of the project.
   * @default ''
   */
  description: string;
  /**
   * Port to run the gRPC server on.
   * @default 50051
   */
  port: number;
  /**
   * Host to run the gRPC server on.
   * @default '[::]'
   */
  host: string;
  /**
   * Whether to include a Dockerfile.
   * @default true
   */
  includeDockerFile: boolean;
}