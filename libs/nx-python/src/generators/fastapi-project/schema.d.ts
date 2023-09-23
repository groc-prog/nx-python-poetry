export interface FastAPIProjectGeneratorSchema {
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
   * Port to run the FastAPI server on.
   * @default 8000
   */
  port: number;
  /**
   * Whether to include a Dockerfile.
   * @default true
   */
  includeDockerFile: boolean;
}
