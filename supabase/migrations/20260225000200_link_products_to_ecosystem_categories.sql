-- SQL Migration: Vincular produtos às categorias do ecossistema
-- Data: 2026-02-25

BEGIN;

-- 1. Garantir que a coluna category em products seja do tipo TEXT para suportar os IDs das categorias
ALTER TABLE public.products 
ALTER COLUMN category TYPE TEXT;

-- 2. Limpar categorias que não existem na tabela ecosystem_categories
-- Conforme solicitado: "caso nao encontre a categoria correta, deixem em branco"
UPDATE public.products p
SET category = NULL
WHERE category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.ecosystem_categories ec 
    WHERE ec.id = p.category
  );

-- 3. Adicionar restrição de chave estrangeira (LINK)
-- Isso garante integridade referencial daqui para frente
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_category_fkey,
ADD CONSTRAINT products_category_fkey 
FOREIGN KEY (category) 
REFERENCES public.ecosystem_categories(id) 
ON DELETE SET NULL;

COMMIT;
