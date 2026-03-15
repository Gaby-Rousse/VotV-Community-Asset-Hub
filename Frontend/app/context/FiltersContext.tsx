import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { defaultFilters, type Filters } from "~/models/interfaces/Filters";

interface FiltersContextType {
    filters: Filters;
    setFilters: Dispatch<SetStateAction<Filters>>;
}

const FilterContext = createContext<FiltersContextType>({
    filters: defaultFilters,
    setFilters: () => {}
});

export const FiltersProvider = ({ children }: any) => {
    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const value = useMemo(() => ({ filters, setFilters }), [filters]);
    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => useContext(FilterContext);