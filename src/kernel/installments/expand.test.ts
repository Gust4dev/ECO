import { describe, it, expect } from "vitest";
import { expandInstallments, calculateInstallmentAmount } from "./expand";

describe("expandInstallments", () => {
  it("deve expandir parcelas corretamente", () => {
    const result = expandInstallments({
      description: "iPhone",
      totalAmountCents: 120000,
      installments: 12,
      startDate: new Date("2024-01-15"),
    });

    expect(result).toHaveLength(12);
    expect(result[0].installmentNumber).toBe(1);
    expect(result[11].installmentNumber).toBe(12);
    expect(result[0].installmentTotal).toBe(12);
  });

  it("deve distribuir centavos extras na primeira parcela", () => {
    const result = expandInstallments({
      description: "Compra",
      totalAmountCents: 10001,
      installments: 3,
      startDate: new Date("2024-01-01"),
    });

    const total = result.reduce((sum, r) => sum + r.amountCents, 0);
    expect(total).toBe(10001);
    expect(result[0].amountCents).toBe(3335);
    expect(result[1].amountCents).toBe(3333);
    expect(result[2].amountCents).toBe(3333);
  });

  it("deve gerar descrições com número da parcela", () => {
    const result = expandInstallments({
      description: "Teste",
      totalAmountCents: 30000,
      installments: 3,
      startDate: new Date("2024-01-01"),
    });

    expect(result[0].description).toBe("Teste (1/3)");
    expect(result[1].description).toBe("Teste (2/3)");
    expect(result[2].description).toBe("Teste (3/3)");
  });

  it("deve manter o mesmo installmentGroupId para todas as parcelas", () => {
    const result = expandInstallments({
      description: "Grupo",
      totalAmountCents: 60000,
      installments: 6,
      startDate: new Date("2024-01-01"),
    });

    const groupId = result[0].installmentGroupId;
    expect(result.every((r) => r.installmentGroupId === groupId)).toBe(true);
  });

  it("deve gerar datas de competência corretas", () => {
    const result = expandInstallments({
      description: "Mensal",
      totalAmountCents: 30000,
      installments: 3,
      startDate: new Date("2024-01-15"),
    });

    expect(result[0].competenceAt.getMonth()).toBe(0);
    expect(result[1].competenceAt.getMonth()).toBe(1);
    expect(result[2].competenceAt.getMonth()).toBe(2);
  });

  it("deve respeitar o dia do mês especificado", () => {
    const result = expandInstallments({
      description: "Dia fixo",
      totalAmountCents: 20000,
      installments: 2,
      startDate: new Date("2024-01-10"),
      dayOfMonth: 25,
    });

    expect(result[0].occurredAt.getDate()).toBe(25);
    expect(result[1].occurredAt.getDate()).toBe(25);
  });

  it("deve ajustar para o último dia em meses curtos", () => {
    const result = expandInstallments({
      description: "Fim do mês",
      totalAmountCents: 20000,
      installments: 2,
      startDate: new Date("2024-01-31"),
      dayOfMonth: 31,
    });

    expect(result[1].occurredAt.getDate()).toBe(29);
  });

  it("deve rejeitar número de parcelas inválido", () => {
    expect(() =>
      expandInstallments({
        description: "Inválido",
        totalAmountCents: 10000,
        installments: 0,
        startDate: new Date(),
      })
    ).toThrow("Número de parcelas deve ser entre 1 e 72");

    expect(() =>
      expandInstallments({
        description: "Inválido",
        totalAmountCents: 10000,
        installments: 100,
        startDate: new Date(),
      })
    ).toThrow("Número de parcelas deve ser entre 1 e 72");
  });

  it("deve rejeitar valor zero ou negativo", () => {
    expect(() =>
      expandInstallments({
        description: "Zero",
        totalAmountCents: 0,
        installments: 3,
        startDate: new Date(),
      })
    ).toThrow("Valor total deve ser maior que zero");
  });
});

describe("calculateInstallmentAmount", () => {
  it("deve calcular valores base e primeira parcela", () => {
    const result = calculateInstallmentAmount(10000, 3);
    expect(result.baseAmount).toBe(3333);
    expect(result.firstAmount).toBe(3334);
  });

  it("deve lidar com divisão exata", () => {
    const result = calculateInstallmentAmount(9000, 3);
    expect(result.baseAmount).toBe(3000);
    expect(result.firstAmount).toBe(3000);
  });
});