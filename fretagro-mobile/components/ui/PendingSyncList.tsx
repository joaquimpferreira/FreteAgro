// components/ui/PendingSyncList.tsx
// Layer: components — may import from lib/, hooks/, store/ only; not from app/
// Renders a scrollable list of operations pending synchronisation (FR-028).
// Opened via the "Ver pendentes (N)" Pressable on OfflineBanner when pendingCount > 0.
// Read-only — does not dequeue or modify the queue.

import { View, Text, FlatList, Modal, Pressable } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { peek, type OperacaoPendente, type OperacaoTipo } from '../../lib/storage/queueStorage'

// Human-readable PT-BR labels for each operation type
const TIPO_LABELS: Record<OperacaoTipo, string> = {
  CREATE_VIAGEM: 'Nova viagem',
  CREATE_TRECHO: 'Trecho de viagem',
  CREATE_ABASTECIMENTO: 'Abastecimento',
  CREATE_LANCAMENTO: 'Despesa',
  CLOSE_TRECHO: 'Fechamento de trecho',
  CLOSE_VIAGEM: 'Encerramento de viagem',
}

interface PendingSyncListProps {
  visible: boolean
  onClose: () => void
}

function PendingRow({ item }: { item: OperacaoPendente }) {
  const label = TIPO_LABELS[item.tipo] ?? item.tipo
  const relativeTime = formatDistanceToNow(new Date(item.updatedAt), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <View className="px-4 py-3 border-b border-zinc-800">
      <Text className="text-white text-sm font-medium">{label}</Text>
      <Text className="text-zinc-400 text-xs mt-0.5">
        {relativeTime}
        {item.tentativas > 0
          ? ` · ${item.tentativas} tentativa${item.tentativas > 1 ? 's' : ''}`
          : ''}
      </Text>
    </View>
  )
}

export function PendingSyncList({ visible, onClose }: PendingSyncListProps) {
  // peek() is a synchronous MMKV read — safe to call inside render
  const ops = peek()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-zinc-900 rounded-t-2xl pb-8" style={{ maxHeight: '70%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
            <Text className="text-white text-base font-semibold">
              Pendentes de sincronização ({ops.length})
            </Text>
            <Pressable
              onPress={onClose}
              className="min-h-[44px] px-2 justify-center"
              accessibilityRole="button"
              accessibilityLabel="Fechar lista de pendentes"
            >
              <Text className="text-green-500 text-sm font-medium">Fechar</Text>
            </Pressable>
          </View>

          {/* Content */}
          {ops.length === 0 ? (
            <View className="p-6 items-center">
              <Text className="text-zinc-400 text-sm">Nenhum item pendente</Text>
            </View>
          ) : (
            <FlatList
              data={ops}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PendingRow item={item} />}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}
