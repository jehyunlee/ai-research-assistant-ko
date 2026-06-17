import React, { useState } from "react"
import { Bars3Icon } from "@heroicons/react/24/outline"
import { PlusCircleIcon, MinusCircleIcon } from "@heroicons/react/20/solid"
import { LegacyResearchAssistant } from "../../../models/legacyAssistant"
import { useDialog } from "../../../hooks/useDialog"
import { DropdownMenu } from "../../components/navigations/DropdownMenu"
import { Confirmation } from "../../components/navigations/Confirmation"
import { chatHistoryToNote } from "../../utils/chatHistory"
import { Message } from "../../../typings/legacyMessages"
import { useDragging } from "../../../hooks/useDragging"
import { useZoom } from "../../../hooks/useZoom"
import { useAssistant } from "../../../hooks/useAssistant"
import { getString } from "../../../utils/locale"

interface ScaleButtonGroupProps {
  scale: number
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

function ScaleButtonGroup({
  scale,
  zoomIn,
  zoomOut,
  reset,
}: ScaleButtonGroupProps) {
  return (
    <div className="px-4 py-2 flex flex-row">
      <div>{getString("menu-zoom-label")}</div>
      <div className="h-5 inline-flex rounded-md shadow-sm">
        <MinusCircleIcon
          className="opacity-50 hover:opacity-90 w-full"
          onClick={zoomOut}
        />
        <span className="text-center">{scale.toFixed(2)}</span>
        <PlusCircleIcon
          className="opacity-50 hover:opacity-90 w-full"
          onClick={zoomIn}
        />
      </div>
    </div>
  )
}

interface MenuProps {
  containerRef: React.RefObject<HTMLDivElement>
  resetMemory: LegacyResearchAssistant["resetMemory"]
  clearMessages: () => void
  messages: Message[]
  zoom: ReturnType<typeof useZoom>
  hasNotification?: boolean
}

export function MainMenu({
  containerRef,
  resetMemory,
  clearMessages,
  messages,
  zoom,
  hasNotification,
}: MenuProps) {
  const dialog = useDialog()
  const { assistant } = useAssistant()
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState<
    React.ReactNode | undefined
  >(undefined)
  const [confirmationCallback, setConfirmationCallback] = useState<
    (() => void) | undefined
  >(undefined)
  const { setDropArea } = useDragging()

  const items = [
    {
      type: "BUTTON" as const,
      label: dialog.mode === "NORMAL" ? getString("menu-minimize") : getString("menu-restore"),
      handleClick: () => {
        if (dialog.mode === "NORMAL") {
          dialog.minimize()
        } else {
          dialog.restore()
        }
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          }
        }, 50)
      },
    },
    {
      type: "COMPONENT" as const,
      label: getString("menu-zoom"),
      Component: ScaleButtonGroup,
      props: {
        scale: zoom.scale,
        zoomIn: () => zoom.setScale(zoom.scale + 25),
        zoomOut: () => zoom.setScale(zoom.scale - 25),
        reset: () => zoom.setScale(1),
      },
    },
    {
      type: "SEPARATOR" as const,
      label: "Separator 1",
    },
    {
      type: "BUTTON" as const,
      label: getString("menu-save-chat"),
      disabled: messages.length === 0,
      handleClick: async () => await chatHistoryToNote(messages),
    },
    {
      type: "BUTTON" as const,
      label: getString("menu-clear-chat"),
      disabled: messages.length === 0,
      handleClick: () => {
        setConfirmationOpen(true)
        setConfirmationMessage(
          <div className="py-4">
            {getString("menu-confirm-clear-chat")}
          </div>,
        )
        setConfirmationCallback(() => () => {
          clearMessages()
          resetMemory()
        })
        setDropArea(undefined)
      },
    },
    {
      type: "BUTTON" as const,
      label: getString("menu-rebuild-file-cache"),
      handleClick: () => {
        setConfirmationOpen(true)
        setConfirmationMessage(
          <div className="py-4">
            {getString("menu-confirm-rebuild-cache")}
          </div>,
        )
        setConfirmationCallback(
          () => async (setProgress: (pct: number) => void) => {
            await assistant.rebuildFileCache(setProgress)
          },
        )
        setDropArea(undefined)
      },
    },
    {
      type: "BUTTON" as const,
      label: getString("menu-clear-file-index"),
      handleClick: () => {
        setConfirmationOpen(true)
        setConfirmationMessage(
          <div className="py-4">
            {getString("menu-confirm-clear-file-index")}
          </div>,
        )
        setConfirmationCallback(
          () => async (setProgress: (pct: number) => void) => {
            await assistant.clearFileIndex(setProgress)
          },
        )
        setDropArea(undefined)
      },
    },
    {
      type: "BUTTON" as const,
      label: getString("menu-feedback"),
      handleClick: () => {
        Zotero.launchURL(
          `https://github.com/lifan0127/ai-research-assistant/issues`,
        )
      },
    },
    {
      type: "BUTTON" as const,
      label: getString("menu-close"),
      handleClick: () => {
        dialog.close()
      },
    },
  ]

  return (
    <>
      <DropdownMenu items={items} Icon={Bars3Icon} />
      <Confirmation
        message={confirmationMessage}
        open={confirmationOpen}
        setOpen={setConfirmationOpen}
        callback={confirmationCallback}
      />
    </>
  )
}
