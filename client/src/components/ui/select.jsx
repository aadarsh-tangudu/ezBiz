import { NativeSelect } from "@chakra-ui/react"
import * as React from "react"

export const Select = React.forwardRef(function Select(props, ref) {
  const { items, children, placeholder, value, onChange, disabled, name, ...rest } = props

  return (
    <NativeSelect.Root disabled={disabled} {...rest}>
      <NativeSelect.Field ref={ref} placeholder={placeholder} value={value} onChange={onChange} name={name}>
        {items && items.map((item) => (
          <option key={item.value !== undefined ? item.value : item} value={item.value !== undefined ? item.value : item}>
            {item.label !== undefined ? item.label : item}
          </option>
        ))}
        {children}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
})
