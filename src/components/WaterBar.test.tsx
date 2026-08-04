import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { WaterBar } from './WaterBar'

afterEach(cleanup)

/** Les valeurs numériques sont surchargeables ; les callbacks sont à nous. */
function setup(props: Partial<Pick<Parameters<typeof WaterBar>[0], 'ml' | 'target' | 'canUndo'>> = {}) {
  const onAdd = vi.fn().mockResolvedValue(undefined)
  const onUndo = vi.fn().mockResolvedValue(undefined)
  const onReset = vi.fn().mockResolvedValue(undefined)
  render(
    <WaterBar
      ml={1250}
      target={3000}
      canUndo
      {...props}
      onAdd={onAdd}
      onUndo={onUndo}
      onReset={onReset}
    />
  )
  return { onAdd, onUndo, onReset }
}

const openMenu = () => act(() => void fireEvent.click(screen.getByLabelText('Corriger')))

test('affiche le total, l’objectif et le pourcentage', () => {
  setup()
  expect(screen.getByText(/1\.3 L/).textContent).toContain('/ 3 L')
  expect(screen.getByText('42 %')).toBeDefined()
})

test('les trois contenants envoient bien leur volume', async () => {
  const { onAdd } = setup()
  await act(async () => void fireEvent.click(screen.getByLabelText(/Ajouter 500 millilitres/)))
  expect(onAdd).toHaveBeenCalledWith(500)
})

test('les boutons portent le nom du contenant, absent à l’écran', () => {
  setup()
  // La place ne permet plus « Verre » sous chaque bouton : le nom passe en
  // libellé accessible, l'information n'est pas perdue.
  expect(screen.getByLabelText(/Ajouter 250 millilitres \(Verre\)/)).toBeDefined()
  expect(screen.getByLabelText(/Ajouter 750 millilitres \(Gourde\)/)).toBeDefined()
  expect(screen.queryByText('Gourde')).toBeNull()
})

test('les corrections sont derrière un menu, pas au premier plan', () => {
  setup()
  // Rien tant qu'on n'a pas ouvert : elles ne pèsent pas comme les ajouts.
  expect(screen.queryByText('Annuler le dernier')).toBeNull()
  expect(screen.queryByText('Remettre à zéro')).toBeNull()

  openMenu()
  expect(screen.getByText('Annuler le dernier')).toBeDefined()
  expect(screen.getByText('Remettre à zéro')).toBeDefined()
})

test('annuler le dernier ajout passe par le menu et le referme', async () => {
  const { onUndo } = setup()
  openMenu()
  await act(async () => void fireEvent.click(screen.getByText('Annuler le dernier')))

  expect(onUndo).toHaveBeenCalled()
  expect(screen.queryByText('Annuler le dernier')).toBeNull()
})

test('la remise à zéro reste accessible objectif atteint', async () => {
  const { onReset } = setup({ ml: 3000 })
  expect(screen.getByText('100 %')).toBeDefined()

  openMenu()
  await act(async () => void fireEvent.click(screen.getByText('Remettre à zéro')))
  expect(onReset).toHaveBeenCalled()
})

test('à zéro et sans historique, il n’y a rien à corriger', () => {
  setup({ ml: 0, canUndo: false })
  expect(screen.getByLabelText('Corriger').hasAttribute('disabled')).toBe(true)
})

test('à zéro mais avec un ajout annulable, le menu reste ouvrable', () => {
  setup({ ml: 0, canUndo: true })
  expect(screen.getByLabelText('Corriger').hasAttribute('disabled')).toBe(false)
  openMenu()
  expect(screen.getByText('Remettre à zéro').hasAttribute('disabled')).toBe(true)
  expect(screen.getByText('Annuler le dernier').hasAttribute('disabled')).toBe(false)
})

test('un objectif à zéro ne produit pas de pourcentage absurde', () => {
  setup({ ml: 500, target: 0 })
  expect(screen.getByText('0 %')).toBeDefined()
})
