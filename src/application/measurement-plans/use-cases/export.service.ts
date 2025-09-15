import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { MeasurementPlanService } from './measurement-plan.service';
import { ExportFormat, ExportOptionsDto } from '../dtos/export.dto';

@Injectable()
export class ExportService {
  constructor(private readonly measurementPlanService: MeasurementPlanService) {
    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
  }

  async generateExport(
    planId: string,
    organizationId: string,
    format: ExportFormat,
    options?: ExportOptionsDto,
  ): Promise<{ filePath: string; filename: string }> {
    // Get the measurement plan data
    const planData = await this.measurementPlanService.findOne(
      planId,
      organizationId,
    );
    if (!planData) {
      throw new NotFoundException(
        `Measurement plan with ID "${planId}" not found`,
      );
    }

    const filename = `measurement-plan-${planId}.${format}`;
    const filePath = path.join(process.cwd(), 'exports', filename);

    switch (format) {
      case ExportFormat.PDF:
        await this.generatePDF(planData, filePath, options);
        break;
      case ExportFormat.DOCX:
        await this.generateDOCX(planData, filePath, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return { filePath, filename };
  }

  private async generatePDF(
    planData: any,
    filePath: string,
    options?: ExportOptionsDto,
  ): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Create HTML template
      const htmlTemplate = this.createHTMLTemplate(planData, options);

      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

      // Generate PDF
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm',
        },
      });
    } finally {
      await browser.close();
    }
  }

  private async generateDOCX(
    planData: any,
    filePath: string,
    options?: ExportOptionsDto,
  ): Promise<void> {
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 24, // 12pt = 24 half-points
              color: '000000',
            },
            paragraph: {
              spacing: {
                line: 360, // 1.5 line spacing (240 * 1.5 = 360)
              },
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: planData.planName.toUpperCase(),
                  bold: true,
                  size: 32, // 16pt
                  font: 'Arial',
                  color: '000000',
                }),
              ],
              alignment: 'center',
              spacing: {
                line: 360,
                after: 400,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Projeto Associado: `,
                  bold: true,
                  font: 'Arial',
                  size: 24,
                  color: '000000',
                }),
                new TextRun({
                  text: planData.associatedProjectName || 'N/A',
                  font: 'Arial',
                  size: 24,
                  color: '000000',
                }),
              ],
              spacing: {
                line: 360,
                after: 240,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Responsável pelo Plano: `,
                  bold: true,
                  font: 'Arial',
                  size: 24,
                  color: '000000',
                }),
                new TextRun({
                  text: planData.planResponsible,
                  font: 'Arial',
                  size: 24,
                  color: '000000',
                }),
              ],
              spacing: {
                line: 360,
                after: 480,
              },
            }),
            new Paragraph({ text: '' }), // Empty line

            // Objectives
            ...this.createObjectivesContent(planData, options),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
  }

  private createHTMLTemplate(
    planData: any,
    options?: ExportOptionsDto,
  ): string {
    // Register handlebars helper for index calculations
    handlebars.registerHelper(
      'add',
      function (value: number, addition: number) {
        return value + addition;
      },
    );

    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{{planName}}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 10mm 15mm 15mm 15mm;
                line-height: 1.5;
                color: #000000;
                font-size: 12pt;
            }
            .header {
                margin-bottom: 30px;
                text-align: left;
            }
            .plan-info {
                font-size: 14pt;
                margin-bottom: 12px;
                color: #000000;
                line-height: 1.5;
            }
            .plan-info strong {
                color: #000000;
                font-weight: bold;
            }

            ul {
                margin: 0;
                padding-left: 20px;
                list-style-type: disc;
            }
            ul ul {
                list-style-type: circle;
                margin-top: 8px;
            }
            ul ul ul {
                list-style-type: square;
            }
            li {
                margin-bottom: 12px;
                line-height: 1.5;
                color: #000000;
                font-size: 12pt;
            }
            .objective-title {
                font-size: 14pt;
                font-weight: bold;
                color: #000000;
                line-height: 1.5;
                margin-bottom: 8px;
            }
            .question-title {
                font-size: 13pt;
                font-weight: bold;
                color: #000000;
                line-height: 1.5;
                margin-bottom: 6px;
            }
            .metric-title {
                font-size: 13pt;
                font-weight: bold;
                color: #000000;
                line-height: 1.5;
                margin-bottom: 6px;
            }

            .info-section-title {
                font-size: 12pt;
                font-weight: bold;
                margin-bottom: 6px;
                color: #000000;
                line-height: 1.5;
            }
            .info-item {
                font-size: 12pt;
                margin-bottom: 4px;
                line-height: 1.5;
                color: #000000;
            }
            .info-item strong {
                color: #000000;
                font-weight: bold;
            }
            .measurement-title {
                font-size: 12pt;
                font-weight: bold;
                margin-bottom: 6px;
                color: #000000;
                line-height: 1.5;
            }
            .measurement-info {
                font-size: 12pt;
                margin-bottom: 4px;
                line-height: 1.5;
                color: #000000;
            }
            .measurement-info strong {
                color: #000000;
                font-weight: bold;
            }

            .objective-container {
                margin-bottom: 40px;

            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="plan-info"><strong>Nome do plano:</strong> {{planName}}</div>
            <div class="plan-info"><strong>Projeto Associado:</strong> {{#if associatedProjectName}}{{associatedProjectName}}{{else}}N/A{{/if}}</div>
            <div class="plan-info"><strong>Responsável pelo Plano:</strong> {{planResponsible}}</div>
        </div>

        <ul>
        {{#each objectives}}
            <li class="objective-container">
                <div class="objective-title">Objetivo {{add @index 1}}: {{objectiveTitle}}</div>
                {{#if questions}}
                <ul>
                {{#each questions}}
                    <li>
                        <div class="question-title">Questão {{add @index 1}}: {{questionText}}</div>
                        {{#if metrics}}
                        <ul>
                        {{#each metrics}}
                            <li>
                                <div class="metric-title">Métrica {{add @index 1}}: {{metricName}}</div>
                                <ul>
                                    <li>
                                        <div class="info-section-title">Informações Gerais:</div>
                                        <div class="info-item"><strong>Descrição da Métrica:</strong> {{metricDescription}}</div>
                                        <div class="info-item"><strong>Mnemônico da Métrica:</strong> {{metricMnemonic}}</div>
                                        <div class="info-item"><strong>Fórmula da Métrica:</strong> {{metricFormula}}</div>
                                    </li>
                                    {{#if ../../../options.includeAnalysis}}
                                    <li>
                                        <div class="info-section-title">Controle e Análise</div>
                                        <div class="info-item"><strong>Intervalo de Controle da Métrica:</strong> [{{metricControlRange.[0]}}, {{metricControlRange.[1]}}]</div>
                                        <div class="info-item"><strong>Procedimento de Análise:</strong> {{analysisProcedure}}</div>
                                        <div class="info-item"><strong>Frequência de Análise:</strong> {{analysisFrequency}}</div>
                                        {{#if analysisResponsible}}
                                        <div class="info-item"><strong>Responsável pela Análise:</strong> {{analysisResponsible}}</div>
                                        {{/if}}
                                    </li>
                                    {{/if}}
                                    {{#if ../../../options.includeMeasurements}}
                                    <li>
                                        <div class="info-section-title">Detalhes da Medida</div>
                                        {{#each measurements}}
                                        <div class="measurement-title">Medida {{add @index 1}}</div>
                                        <div class="measurement-info"><strong>Propriedades de Medida:</strong> {{measurementProperties}}</div>
                                        <div class="measurement-info"><strong>Unidade de Medida:</strong> {{measurementUnit}}</div>
                                        <div class="measurement-info"><strong>Escala de Medida:</strong> {{measurementScale}}</div>
                                        <div class="measurement-info"><strong>Procedimento de Medida:</strong> {{measurementProcedure}}</div>
                                        <div class="measurement-info"><strong>Frequência de Medida:</strong> {{measurementFrequency}}</div>
                                        {{#if measurementResponsible}}
                                        <div class="measurement-info"><strong>Responsável pela Medida:</strong> {{measurementResponsible}}</div>
                                        {{/if}}
                                        {{/each}}
                                    </li>
                                    {{/if}}
                                </ul>
                            </li>
                        {{/each}}
                        </ul>
                        {{/if}}
                    </li>
                {{/each}}
                </ul>
                {{/if}}
            </li>
        {{/each}}
        </ul>
    </body>
    </html>
    `;

    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate({
      ...planData,
      createdDate: new Date(planData.createdAt).toLocaleDateString(),
      options: options || {},
    });
  }

  private createStatisticsTable(planData: any): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `Objectives: ${planData.objectivesCount || 0}`,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Questions: ${planData.questionsCount || 0}`,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Metrics: ${planData.metricsCount || 0}`,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Measurements: ${planData.measurementsCount || 0}`,
          }),
        ],
      }),
      new Paragraph({ text: '' }), // Empty line
    ];
  }

  private createObjectivesContent(
    planData: any,
    options?: ExportOptionsDto,
  ): Paragraph[] {
    const content: Paragraph[] = [];

    if (planData.objectives && planData.objectives.length > 0) {
      planData.objectives.forEach((objective: any, objIndex: number) => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Objetivo ${objIndex + 1}: ${objective.objectiveTitle}`,
                bold: true,
                font: 'Arial',
                size: 28, // 14pt
                color: '000000',
              }),
            ],
            spacing: {
              line: 360,
              before: 240,
              after: 240,
            },
          }),
        );

        if (objective.questions && objective.questions.length > 0) {
          objective.questions.forEach((question: any, qIndex: number) => {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `- Questão ${qIndex + 1}: ${question.questionText}`,
                    size: 26, // 13pt
                    bold: true,
                    font: 'Arial',
                    color: '000000',
                  }),
                ],
                indent: {
                  left: 360,
                },
                spacing: {
                  line: 360,
                  after: 200,
                },
              }),
            );

            if (question.metrics && question.metrics.length > 0) {
              question.metrics.forEach((metric: any, mIndex: number) => {
                content.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `- Métrica ${mIndex + 1}: ${metric.metricName}`,
                        size: 26, // 13pt
                        bold: true,
                        font: 'Arial',
                        color: '000000',
                      }),
                    ],
                    indent: {
                      left: 720,
                    },
                    spacing: {
                      line: 360,
                      after: 200,
                    },
                  }),
                );

                // Informações Gerais
                content.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Informações Gerais:',
                        size: 24,
                        bold: true,
                        font: 'Arial',
                        color: '000000',
                      }),
                    ],
                    indent: {
                      left: 1080,
                    },
                    spacing: {
                      line: 360,
                      before: 200,
                      after: 160,
                    },
                  }),
                );

                content.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Descrição da Métrica: `,
                        size: 24,
                        bold: true,
                        font: 'Arial',
                        color: '000000',
                      }),
                      new TextRun({
                        text: metric.metricDescription,
                        size: 24,
                        font: 'Arial',
                        color: '000000',
                      }),
                    ],
                    indent: {
                      left: 1440,
                    },
                    spacing: {
                      line: 360,
                      after: 120,
                    },
                  }),
                );

                content.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Mnemônico da Métrica: `,
                        size: 24,
                        bold: true,
                        font: 'Arial',
                        color: '000000',
                      }),
                      new TextRun({
                        text: metric.metricMnemonic,
                        size: 24,
                        font: 'Arial',
                        color: '000000',
                      }),
                    ],
                    indent: {
                      left: 1440,
                    },
                    spacing: {
                      line: 360,
                      after: 120,
                    },
                  }),
                );

                content.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Fórmula da Métrica: `,
                        size: 24,
                        bold: true,
                        font: 'Arial',
                        color: '000000',
                      }),
                      new TextRun({
                        text: metric.metricFormula,
                        size: 24,
                        font: 'Arial',
                        color: '000000',
                      }),
                    ],
                    indent: {
                      left: 1440,
                    },
                    spacing: {
                      line: 360,
                      after: 200,
                    },
                  }),
                );

                // Controle e Análise
                if (options?.includeAnalysis) {
                  content.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Controle e Análise',
                          size: 24,
                          bold: true,
                          font: 'Arial',
                          color: '000000',
                        }),
                      ],
                      indent: {
                        left: 1080,
                      },
                      spacing: {
                        line: 360,
                        before: 200,
                        after: 160,
                      },
                    }),
                  );

                  content.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Intervalo de Controle da Métrica: `,
                          size: 24,
                          bold: true,
                          font: 'Arial',
                          color: '000000',
                        }),
                        new TextRun({
                          text: `[${metric.metricControlRange[0]}, ${metric.metricControlRange[1]}]`,
                          size: 24,
                          font: 'Arial',
                          color: '000000',
                        }),
                      ],
                      indent: {
                        left: 1440,
                      },
                      spacing: {
                        line: 360,
                        after: 120,
                      },
                    }),
                  );

                  content.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Procedimento de Análise: `,
                          size: 24,
                          bold: true,
                          font: 'Arial',
                          color: '000000',
                        }),
                        new TextRun({
                          text: metric.analysisProcedure,
                          size: 24,
                          font: 'Arial',
                          color: '000000',
                        }),
                      ],
                      indent: {
                        left: 1440,
                      },
                      spacing: {
                        line: 360,
                        after: 120,
                      },
                    }),
                  );

                  content.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Frequência de Análise: `,
                          size: 24,
                          bold: true,
                          font: 'Arial',
                          color: '000000',
                        }),
                        new TextRun({
                          text: metric.analysisFrequency,
                          size: 24,
                          font: 'Arial',
                          color: '000000',
                        }),
                      ],
                      indent: {
                        left: 1440,
                      },
                      spacing: {
                        line: 360,
                        after: 120,
                      },
                    }),
                  );

                  if (metric.analysisResponsible) {
                    content.push(
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Responsável pela Análise: `,
                            size: 24,
                            bold: true,
                            font: 'Arial',
                            color: '000000',
                          }),
                          new TextRun({
                            text: metric.analysisResponsible,
                            size: 24,
                            font: 'Arial',
                            color: '000000',
                          }),
                        ],
                        indent: {
                          left: 1440,
                        },
                        spacing: {
                          line: 360,
                          after: 200,
                        },
                      }),
                    );
                  }
                }

                // Detalhes da Medida
                if (options?.includeMeasurements && metric.measurements) {
                  content.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Detalhes da Medida',
                          size: 24,
                          bold: true,
                          font: 'Arial',
                          color: '000000',
                        }),
                      ],
                      indent: {
                        left: 1080,
                      },
                      spacing: {
                        line: 360,
                        before: 200,
                        after: 160,
                      },
                    }),
                  );

                  metric.measurements.forEach(
                    (measurement: any, measIndex: number) => {
                      content.push(
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Medida ${measIndex + 1}`,
                              size: 24,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                          indent: {
                            left: 1440,
                          },
                          spacing: {
                            line: 360,
                            before: 160,
                            after: 120,
                          },
                        }),
                      );

                      content.push(
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Propriedades de Medida: `,
                              size: 24,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                            new TextRun({
                              text: measurement.measurementProperties,
                              size: 24,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                          indent: {
                            left: 1800,
                          },
                          spacing: {
                            line: 360,
                            after: 100,
                          },
                        }),
                      );

                      content.push(
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Unidade de Medida: `,
                              size: 24,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                            new TextRun({
                              text: measurement.measurementUnit,
                              size: 24,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                          indent: {
                            left: 1800,
                          },
                          spacing: {
                            line: 360,
                            after: 100,
                          },
                        }),
                      );

                      content.push(
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Escala de Medida: `,
                              size: 24,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                            new TextRun({
                              text: measurement.measurementScale,
                              size: 24,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                          indent: {
                            left: 1800,
                          },
                          spacing: {
                            line: 360,
                            after: 100,
                          },
                        }),
                      );

                      content.push(
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Procedimento de Medida: `,
                              size: 24,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                            new TextRun({
                              text: measurement.measurementProcedure,
                              size: 24,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                          indent: {
                            left: 1800,
                          },
                          spacing: {
                            line: 360,
                            after: 100,
                          },
                        }),
                      );

                      content.push(
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Frequência de Medida: `,
                              size: 24,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                            new TextRun({
                              text: measurement.measurementFrequency,
                              size: 24,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                          indent: {
                            left: 1800,
                          },
                          spacing: {
                            line: 360,
                            after: 100,
                          },
                        }),
                      );

                      if (measurement.measurementResponsible) {
                        content.push(
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Responsável pela Medida: `,
                                size: 24,
                                bold: true,
                                font: 'Arial',
                                color: '000000',
                              }),
                              new TextRun({
                                text: measurement.measurementResponsible,
                                size: 24,
                                font: 'Arial',
                                color: '000000',
                              }),
                            ],
                            indent: {
                              left: 1800,
                            },
                            spacing: {
                              line: 360,
                              after: 200,
                            },
                          }),
                        );
                      }
                    },
                  );
                }

                content.push(
                  new Paragraph({
                    children: [new TextRun({ text: '', font: 'Arial' })],
                    spacing: { line: 360, after: 240 },
                  }),
                ); // Empty line between metrics
              });
            }
          });
        }
      });
    }

    return content;
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}
